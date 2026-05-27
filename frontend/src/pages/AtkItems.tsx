import { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchItems, Item, updateItem, deleteItem } from '../api/items.api';
import { createRequest } from '../api/requests.api';
import { Download, QrCode, FileText, Upload } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import useAuth from '../hooks/useAuth';
import QRCode from 'react-qr-code';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getApiBaseUrl } from '../api/http';
import { getWIBInputDate } from '../utils/dateUtils';
import { useSearchParams } from 'react-router-dom';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';
import { useTranslation } from '../hooks/useTranslation';

interface EditFormData {
	name: string;
	code: string;
	quantity: number;
	unit: string;
	location: string;
	minStock: number;
}

const AtkItems = () => {
	const { hasRole, user } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const { showToast } = useToast();
	const isSuperadmin = hasRole(['superadmin']);
	const isAdminOrSuperadmin = hasRole(['admin', 'superadmin']);
	const isUser = hasRole(['user']);
	const { t } = useTranslation();

	const [draftSearch, setDraftSearch] = useState('');
	const [draftSort, setDraftSort] = useState<'asc' | 'desc'>('asc');
	const [searchTerm, setSearchTerm] = useState('');
	const [sortOption, setSortOption] = useState<'asc' | 'desc'>('asc');
	const [page, setPage] = useState(1);
	const [items, setItems] = useState<Item[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingItem, setEditingItem] = useState<Item | null>(null);
	const [editFormData, setEditFormData] = useState<EditFormData>({ name: '', code: '', quantity: 0, unit: '', location: '', minStock: 5 });
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	// Request modal for users
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [requestItem, setRequestItem] = useState<Item | null>(null);
	const [requestQty, setRequestQty] = useState(1);
	const [requestPenerima, setRequestPenerima] = useState('');
	const [requestLoading, setRequestLoading] = useState(false);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

	// QR Code modal
	const [showQrModal, setShowQrModal] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
	const [qrItem, setQrItem] = useState<Item | null>(null);

	// Import modal
	const [showImportModal, setShowImportModal] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importLoading, setImportLoading] = useState(false);
	const [importError, setImportError] = useState<string | null>(null);
	const [importSuccess, setImportSuccess] = useState<string | null>(null);
	// Advanced progress tracking
	const [importProgress, setImportProgress] = useState(0);
	const [importPhase, setImportPhase] = useState<string>('');
	const [importCurrentItem, setImportCurrentItem] = useState<string>('');
	const [importStats, setImportStats] = useState({ inserted: 0, updated: 0, skipped: 0, total: 0 });
	const [importLogs, setImportLogs] = useState<Array<{ name: string; action: string }>>([]);

	const handleQrClick = (item: Item) => {
		setQrItem(item);
		setShowQrModal(true);
	};

	const resetImportState = () => {
		setImportProgress(0);
		setImportPhase('');
		setImportCurrentItem('');
		setImportStats({ inserted: 0, updated: 0, skipped: 0, total: 0 });
		setImportLogs([]);
		setImportError(null);
		setImportSuccess(null);
	};

	const handleImportSubmit = async () => {
		if (!importFile) return;
		setImportLoading(true);
		resetImportState();
		setImportPhase('uploading');
		
		try {
			const formData = new FormData();
			formData.append('file', importFile);
			
			const response = await fetch(`${getApiBaseUrl()}/atk-items/bulk-stream`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: formData
			});
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.message || 'Gagal import data');
			}

			// Read SSE stream
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) throw new Error('Stream tidak tersedia');

			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				let eventType = '';
				for (const line of lines) {
					if (line.startsWith('event: ')) {
						eventType = line.slice(7).trim();
					} else if (line.startsWith('data: ') && eventType) {
						try {
							const data = JSON.parse(line.slice(6));
							
							switch (eventType) {
								case 'phase':
									setImportPhase(data.phase);
									if (data.totalRows) {
										setImportStats(prev => ({ ...prev, total: data.totalRows }));
									}
									break;
								case 'progress':
									setImportProgress(data.percent);
									setImportCurrentItem(data.itemName);
									setImportStats({
										inserted: data.insertedCount,
										updated: data.updatedCount,
										skipped: data.skippedCount,
										total: data.total,
									});
									setImportLogs(prev => {
										const newLogs = [...prev, { name: data.itemName, action: data.action }];
										return newLogs.slice(-50); // Keep last 50 entries
									});
									break;
								case 'complete': {
									setImportPhase('complete');
									setImportProgress(100);
									setImportSuccess(data.message);
									setImportStats({
										inserted: data.insertedCount,
										updated: data.updatedCount,
										skipped: data.skippedCount,
										total: data.totalRows,
									});
									// Refresh list
									const rows = await fetchItems();
									setItems(rows);
									break;
								}
								case 'error':
									setImportPhase('error');
									setImportError(data.message + (data.errors ? '\n' + data.errors.join('\n') : ''));
									break;
							}
						} catch { /* ignore parse errors */ }
						eventType = '';
					}
				}
			}
		} catch (err: any) {
			setImportPhase('error');
			setImportError(err.message);
		} finally {
			setImportLoading(false);
		}
	};

	const perPage = 10;

	useEffect(() => {
		setPage(1);
	}, [searchTerm, sortOption]);

	useEffect(() => {
		const querySearch = searchParams.get('search') || '';
		if (querySearch) {
			setDraftSearch(querySearch);
			setSearchTerm(querySearch);
		}
	}, [searchParams]);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		fetchItems()
			.then((rows) => {
				if (!mounted) return;
				setItems(rows);
				setError(null);
			})
			.catch(() => {
				if (!mounted) return;
				setItems([]);
				setError('Gagal memuat data ATK dari server');
			})
			.finally(() => {
				if (!mounted) return;
				setLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, []);

	const filtered = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		const stockFilter = searchParams.get('stock');
		let result = items;
		if (stockFilter === 'low') {
			result = result.filter((item) => item.quantity === 0 || item.quantity <= (item.minStock ?? 5));
		}
		if (term) {
			result = result.filter((item) =>
				[item.name, item.code].some((value) => value?.toLowerCase().includes(term))
			);
		}
		const sorted = [...result].sort((a, b) => {
			return sortOption === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
		});
		return sorted;
	}, [searchTerm, sortOption, items, searchParams]);

	const hasDashboardFilter = searchParams.has('search') || searchParams.has('stock');

	const clearDashboardFilter = () => {
		setSearchParams({});
		setDraftSearch('');
		setSearchTerm('');
	};

	const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
	const currentPage = Math.min(page, totalPages);
	const startIndex = (currentPage - 1) * perPage;
	const endIndex = Math.min(startIndex + perPage, filtered.length);
	const displayItems = filtered.slice(startIndex, endIndex);

	const handleApply = () => {
		setSearchTerm(draftSearch);
		setSortOption(draftSort);
	};

	const handleEditClick = (item: Item) => {
		if (!isSuperadmin) {
			setEditError('Hanya superadmin yang dapat mengubah stok atau data item');
			return;
		}
		setEditingItem(item);
		setEditFormData({
			name: item.name,
			code: item.code,
			quantity: item.quantity,
			unit: item.unit,
			location: item.location,
			minStock: item.minStock || 5,
		});
		setEditError(null);
		setShowEditModal(true);
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingItem || !editFormData.name || !editFormData.unit) {
			setEditError('Nama barang dan satuan tidak boleh kosong');
			return;
		}
		if (Number.isNaN(editFormData.quantity) || editFormData.quantity < 0) {
			setEditError('Jumlah stok harus 0 atau lebih');
			return;
		}

		setEditLoading(true);
		setEditError(null);
		try {
			await updateItem(editingItem.id, {
				nama_barang: editFormData.name,
				kode_barang: editFormData.code,
				qty: editFormData.quantity,
				satuan: editFormData.unit,
				lokasi_simpan: editFormData.location,
				min_stock: editFormData.minStock,
			});
			setItems(items.map(item =>
				item.id === editingItem.id
					? { ...item, name: editFormData.name, code: editFormData.code, quantity: editFormData.quantity, unit: editFormData.unit, location: editFormData.location, minStock: editFormData.minStock }
					: item
			));
			setShowEditModal(false);
			setEditingItem(null);
		} catch (err: any) {
			setEditError(err.message || 'Gagal memperbarui item');
		} finally {
			setEditLoading(false);
		}
	};

	const handleDeleteClick = (item: Item) => {
		if (!isSuperadmin) return;
		setDeleteTarget(item);
	};

	const confirmDeleteItem = async () => {
		if (!deleteTarget) return;
		try {
			await deleteItem(deleteTarget.id);
			setItems(items.filter(i => i.id !== deleteTarget.id));
			setDeleteTarget(null);
		} catch (err: any) {
			let msg = 'Gagal menghapus item';
			try { msg = JSON.parse(err.message).message; } catch { msg = err.message || msg; }
			showToast(msg, 'error');
		}
	};

	// User: Open request modal instead of direct take
	const handleRequestClick = (item: Item) => {
		if (item.quantity <= 0) {
			setRequestError('Barang ini habis');
			return;
		}
		setRequestItem(item);
		setRequestQty(1);
		setRequestPenerima('');
		setRequestError(null);
		setRequestSuccess(null);
		setShowRequestModal(true);
	};

	const handleRequestSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!requestItem || requestQty <= 0) {
			setRequestError('Jumlah harus lebih dari 0');
			return;
		}
		if (requestQty > requestItem.quantity) {
			setRequestError(`Stok hanya ${requestItem.quantity}`);
			return;
		}
		if (!requestPenerima.trim()) {
			setRequestError('Penerima tidak boleh kosong');
			return;
		}

		setRequestLoading(true);
		setRequestError(null);
		try {
			const today = getWIBInputDate();
			await createRequest({
				date: today,
				item: requestItem.name,
				qty: requestQty,
				unit: requestItem.unit,
				receiver: requestPenerima,
				dept: user?.name || 'Unknown',
			});
			setRequestSuccess(`Request untuk ${requestItem.name} (${requestQty} ${requestItem.unit}) berhasil diajukan. Menunggu persetujuan admin.`);
			setTimeout(() => {
				setShowRequestModal(false);
				setRequestItem(null);
			}, 2000);
		} catch (err: any) {
			setRequestError(err.message || 'Gagal membuat request');
		} finally {
			setRequestLoading(false);
		}
	};

	return (
		<div className="items-page">
			<div className="items-filters">
				<div className="search-control">
					<span className="search-icon" aria-hidden>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
							<circle cx="11" cy="11" r="7" />
							<path d="M16.5 16.5 21 21" strokeLinecap="round" />
						</svg>
					</span>
					<input
						className="input-control search-input"
						placeholder="Cari Barang atau Kode Barang..."
						value={draftSearch}
						onChange={(e) => setDraftSearch(e.target.value)}
					/>
				</div>
				<select
					className="select-control"
					aria-label="Urutkan berdasarkan jumlah"
					value={draftSort}
					onChange={(e) => setDraftSort(e.target.value as 'asc' | 'desc')}
				>
					<option value="asc">Jumlah Terkecil</option>
					<option value="desc">Jumlah Terbesar</option>
				</select>
				<Button type="button" className="apply-button" onClick={handleApply} variant="secondary">
					Terapkan
				</Button>
				{isAdminOrSuperadmin && (
					<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
						<Button
							type="button"
							variant="secondary"
							onClick={() => exportToPdf({
								filename: `Daftar_ATK_${getWIBInputDate()}`,
								title: t('inventory.title'),
								columns: [
									{ header: t('inventory.columns.itemName'), dataKey: 'name' },
									{ header: t('inventory.columns.itemCode'), dataKey: 'code' },
									{ header: t('inventory.columns.qty'), dataKey: 'quantity' },
									{ header: t('inventory.columns.unit'), dataKey: 'unit' },
									{ header: t('inventory.columns.location'), dataKey: 'location' },
								],
								data: filtered
							})}
							disabled={filtered.length === 0}
							style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
						>
							<FileText size={16} />
							{t('inventory.pdf')}
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => exportToExcel(filtered, [
								{ header: t('inventory.columns.itemName'), key: 'name' },
								{ header: t('inventory.columns.itemCode'), key: 'code' },
								{ header: t('inventory.columns.qty'), key: 'quantity' },
								{ header: t('inventory.columns.unit'), key: 'unit' },
								{ header: t('inventory.columns.location'), key: 'location' },
							], { filename: `Daftar_ATK_${getWIBInputDate()}`, sheetName: t('inventory.title') })}
							disabled={filtered.length === 0}
							style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
						>
							<Download size={16} />
							{t('inventory.excel')}
						</Button>
						{isSuperadmin && (
							<Button
								type="button"
								variant="primary"
								onClick={() => setShowImportModal(true)}
								style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
							>
								<Upload size={16} />
								{t('inventory.importExcel')}
							</Button>
						)}
					</div>
				)}
			</div>

			{!isSuperadmin && isAdminOrSuperadmin && (
				<div style={{ padding: '12px 16px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
					{t('inventory.superadminNote')}
				</div>
			)}
			{isUser && (
				<div style={{ padding: '12px 16px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
					{t('inventory.userNote')}
				</div>
			)}

			{hasDashboardFilter && (
				<div style={{ padding: '10px 14px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '999px', color: 'var(--accent)', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
					<span>{searchParams.get('stock') === 'low' ? 'Filter dashboard: stok rendah/kosong' : `Filter dashboard: ${searchParams.get('search')}`}</span>
					<Button type="button" variant="ghost" size="sm" onClick={clearDashboardFilter}>Reset</Button>
				</div>
			)}

			<div className="items-card">
				{error && <p className="danger-text" role="alert" style={{ margin: '16px' }}>{error}</p>}
				<Table>
					<THead>
						<TR>
							<TH style={{ width: '52px' }}>{t('inventory.columns.no')}</TH>
							<TH>{t('inventory.columns.itemName')}</TH>
							<TH>{t('inventory.columns.itemCode')}</TH>
							<TH>{t('inventory.columns.qty')}</TH>
							<TH>{t('inventory.columns.unit')}</TH>
							<TH>{t('inventory.columns.location')}</TH>
							<TH style={{ width: '160px' }}>{t('inventory.columns.action')}</TH>
						</TR>
					</THead>
					<TBody>
						{loading ? (
							<SkeletonTableRows rows={6} columns={7} />
						) : displayItems.length === 0 ? (
							<EmptyTableRow
								colSpan={7}
								title={t('inventory.noData')}
								description={searchTerm || searchParams.has('stock') ? t('inventory.noDataDescSearch') : t('inventory.noDataDescEmpty')}
							/>
						) : (
							displayItems.map((item, idx) => {
								const isLowStock = item.quantity <= (item.minStock ?? 5) && item.quantity > 0;
								const isOutOfStock = item.quantity === 0;
								return (
									<TR key={item.id} className={isOutOfStock ? 'row-danger' : isLowStock ? 'row-warning' : ''}>
										<TD>{startIndex + idx + 1}</TD>
										<TD>
											{item.name} 
											{isLowStock && <span title="Stok Kritis" style={{marginLeft: 8, fontSize: '0.8rem'}}>⚠️</span>}
										</TD>
										<TD>{item.code || '-'}</TD>
										<TD>{item.quantity.toLocaleString('id-ID')}</TD>
										<TD>{item.unit}</TD>
										<TD>{item.location || '-'}</TD>
										<TD>
											<div className="action-buttons">
												{isAdminOrSuperadmin && (
													<Button type="button" variant="ghost" size="sm" onClick={() => handleQrClick(item)} title="Lihat QR Code">
														<QrCode size={16} />
													</Button>
												)}
												{isSuperadmin ? (
													<>
													<Button type="button" variant="ghost" size="sm" onClick={() => handleEditClick(item)} aria-label={t('inventory.actions.edit')}>
														✏ {t('inventory.actions.edit')}
													</Button>
													<Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteClick(item)} aria-label={t('inventory.actions.delete')} style={{ color: 'var(--danger)' }}>
														🗑
													</Button>
													</>
												) : isAdminOrSuperadmin ? null : (
													<Button
														type="button"
														variant={item.quantity > 0 ? 'secondary' : 'ghost'}
														size="sm"
														onClick={() => handleRequestClick(item)}
														disabled={item.quantity <= 0}
													>
														{item.quantity > 0 ? `📦 ${t('inventory.actions.take')}` : t('inventory.actions.outOfStock')}
													</Button>
												)}
											</div>
										</TD>
									</TR>
								)
							})
						)}
					</TBody>
				</Table>

				{/* Mobile Card View */}
				<MobileCardList
					isEmpty={displayItems.length === 0}
					isLoading={loading}
					emptyMessage={t('inventory.noData')}
				>
					{displayItems.map((item, idx) => {
						const isLowStock = item.quantity <= (item.minStock ?? 5) && item.quantity > 0;
						return (
						<MobileCard
							key={item.id}
							className={item.quantity <= 0 ? 'card-danger' : isLowStock ? 'card-warning' : ''}
							header={
								<>
									<span className="mobile-card-header-title">{item.name}</span>
									{item.quantity <= 0 && (
										<span className="badge badge-rejected">{t('inventory.actions.outOfStock')}</span>
									)}
								</>
							}
							fields={[
								{ label: t('inventory.columns.no'), value: startIndex + idx + 1 },
								{ label: t('inventory.columns.itemCode'), value: item.code || '-' },
								{ label: t('inventory.columns.qty'), value: `${item.quantity.toLocaleString('id-ID')} ${item.unit}` },
								{ label: t('inventory.columns.location'), value: item.location || '-' },
							]}
							actions={
								isSuperadmin ? (
									<>
										<Button type="button" variant="ghost" onClick={() => handleEditClick(item)}>
											✏ {t('inventory.actions.edit')}
										</Button>
										<Button type="button" variant="ghost" onClick={() => handleDeleteClick(item)} style={{ color: 'var(--danger)' }}>
											🗑 {t('inventory.actions.delete')}
										</Button>
									</>
								) : isAdminOrSuperadmin ? null : (
									<Button
										type="button"
										variant={item.quantity > 0 ? 'secondary' : 'ghost'}
										onClick={() => handleRequestClick(item)}
										disabled={item.quantity <= 0}
									>
										{item.quantity > 0 ? `📦 ${t('inventory.actions.take')}` : t('inventory.actions.outOfStock')}
									</Button>
								)
							}
						/>
						);
					})}
				</MobileCardList>

				<div className="items-footer">
					<span className="items-meta">
						Menampilkan {startIndex + 1} - {endIndex} dari {filtered.length} barang
					</span>
					<Pagination current={currentPage} total={totalPages} onChange={setPage} />
				</div>
			</div>

			{/* Edit Modal - Superadmin Only */}
			<Modal
				isOpen={showEditModal}
				onClose={() => setShowEditModal(false)}
				title={t('inventory.modals.editTitle')}
				footer={
					<div className="form-actions">
						<Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
							{t('inventory.actions.cancel')}
						</Button>
						<Button type="submit" form="edit-form" disabled={editLoading}>
							{editLoading ? t('inventory.actions.saving') : t('inventory.actions.save')}
						</Button>
					</div>
				}
			>
				{editError && <p className="danger-text" style={{ marginBottom: '16px' }}>{editError}</p>}
				<form id="edit-form" onSubmit={handleEditSubmit} className="responsive-modal-form">
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label htmlFor="edit-name" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
							{t('inventory.columns.itemName')} *
						</label>
						<Input
							id="edit-name"
							type="text"
							value={editFormData.name}
							onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
							placeholder="3M Double Tape Abu-Abu"
							required
							style={{ width: '100%' }}
						/>
					</div>
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label htmlFor="edit-code" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
							{t('inventory.columns.itemCode')}
						</label>
						<Input
							id="edit-code"
							type="text"
							value={editFormData.code}
							onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
							placeholder="3M-DTP-GRY"
							style={{ width: '100%' }}
						/>
					</div>
					<div className="form-grid-2">
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label htmlFor="edit-qty" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
								{t('inventory.columns.qty')} *
							</label>
							<Input
								id="edit-qty"
								type="number"
								min={0}
								value={editFormData.quantity}
								onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })}
								placeholder="1"
								required
								style={{ width: '100%' }}
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label htmlFor="edit-unit" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
								{t('inventory.columns.unit')} *
							</label>
							<Input
								id="edit-unit"
								type="text"
								value={editFormData.unit}
								onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
								placeholder="pcs"
								required
								style={{ width: '100%' }}
							/>
						</div>
					</div>
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label htmlFor="edit-location" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
							{t('inventory.columns.location')}
						</label>
						<Input
							id="edit-location"
							type="text"
							value={editFormData.location}
							onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
							placeholder="Lemari A1"
							style={{ width: '100%' }}
						/>
					</div>
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label htmlFor="edit-minstock" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
							{t('inventory.modals.minStockLabel')}
						</label>
						<Input
							id="edit-minstock"
							type="number"
							min={0}
							value={editFormData.minStock}
							onChange={(e) => setEditFormData({ ...editFormData, minStock: Number(e.target.value) })}
							placeholder="5"
							required
							style={{ width: '100%' }}
						/>
						<p className="form-hint">
							{t('inventory.modals.minStockHint')}
						</p>
					</div>
				</form>
			</Modal>

			{/* Request Modal - User Role */}
			<Modal
				isOpen={showRequestModal && !!requestItem}
				onClose={() => setShowRequestModal(false)}
				title={t('inventory.modals.requestTitle')}
				footer={
					<div className="form-actions">
						<Button type="button" variant="secondary" onClick={() => setShowRequestModal(false)}>
							{t('inventory.actions.cancel')}
						</Button>
						<Button type="submit" form="request-form" disabled={requestLoading || !!requestSuccess}>
							{requestLoading ? t('inventory.modals.processRequest') : t('inventory.modals.submitRequest')}
						</Button>
					</div>
				}
			>
				{requestSuccess && (
					<div style={{
						padding: '12px 16px',
						background: 'var(--success-glow)',
						color: 'var(--success)',
						border: '1px solid var(--success)',
						borderRadius: '6px',
						marginBottom: '16px'
					}}>
						{requestSuccess}
					</div>
				)}
				{requestError && <p className="danger-text">{requestError}</p>}
				{requestItem && (
					<form id="request-form" onSubmit={handleRequestSubmit} className="responsive-modal-form">
						<div className="form-group">
							<label htmlFor="req-name">{t('inventory.columns.itemName')}</label>
							<Input
								id="req-name"
								type="text"
								value={requestItem.name}
								disabled
							/>
						</div>
						<div className="form-group">
							<label htmlFor="req-qty">{t('inventory.modals.qtyRequest')}</label>
							<Input
								id="req-qty"
								type="number"
								min="1"
								max={requestItem.quantity}
								value={requestQty}
								onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
								required
							/>
							<p className="form-hint">
								{t('inventory.modals.stockAvailable')}: {requestItem.quantity} {requestItem.unit}
							</p>
						</div>
						<div className="form-group">
							<label htmlFor="req-penerima">{t('inventory.columns.receiver')} *</label>
							<Input
								id="req-penerima"
								type="text"
								value={requestPenerima}
								onChange={(e) => setRequestPenerima(e.target.value)}
								placeholder="Nama penerima"
								required
							/>
						</div>
					</form>
				)}
			</Modal>

			{/* QR Code Modal */}
			<Modal
				isOpen={showQrModal && !!qrItem}
				onClose={() => setShowQrModal(false)}
				title="QR Code Barang"
				footer={
					<div className="form-actions">
						<Button type="button" variant="secondary" onClick={() => setShowQrModal(false)}>
							Tutup
						</Button>
						<Button type="button" onClick={() => window.print()}>
							Cetak
						</Button>
					</div>
				}
			>
				{qrItem && (
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
						<div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
							<QRCode
								value={qrItem.code || qrItem.name}
								size={200}
								bgColor="#ffffff"
								fgColor="#000000"
								level="M"
							/>
						</div>
						<h3 style={{ marginTop: '20px', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>{qrItem.name}</h3>
						<p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Kode: {qrItem.code || '-'}</p>
					</div>
				)}
			</Modal>

			{/* Import Modal */}
			<Modal
				isOpen={showImportModal}
				onClose={() => { if (!importLoading) { setShowImportModal(false); resetImportState(); setImportFile(null); } }}
				title="Import Data ATK"
				footer={
					importPhase === 'complete' ? (
						<div className="form-actions">
							<Button type="button" onClick={() => { setShowImportModal(false); resetImportState(); setImportFile(null); }}>
								Selesai
							</Button>
						</div>
					) : (
						<div className="form-actions">
							<Button type="button" variant="secondary" onClick={() => { if (!importLoading) { setShowImportModal(false); resetImportState(); setImportFile(null); } }} disabled={importLoading}>
								Batal
							</Button>
							<Button type="button" onClick={handleImportSubmit} disabled={!importFile || importLoading}>
								{importLoading ? '⏳ Mengimport...' : '🚀 Mulai Import'}
							</Button>
						</div>
					)
				}
			>
				<div className="responsive-modal-form" style={{ padding: '8px 0' }}>
					
					{/* File selection - only show when not processing */}
					{!importLoading && importPhase !== 'complete' && (
						<>
							<p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
								Pilih file Excel (.xlsx) yang berisi daftar barang. Jika barang sudah ada di sistem, stoknya akan <strong>ditambahkan</strong> secara otomatis dan tercatat di histori barang masuk.
								<strong style={{ display: 'block', margin: '8px 0', padding: '8px', background: 'var(--surface-alt)', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
									Kolom: nama_barang, kode_barang, qty, min_stock, satuan, lokasi_simpan
								</strong>
							</p>
							<div className="form-group">
								<label htmlFor="import-file">Upload File Excel</label>
								<input 
									id="import-file"
									type="file" 
									accept=".xlsx, .xls, .csv" 
									onChange={(e) => { setImportFile(e.target.files?.[0] || null); resetImportState(); }}
									className="input-control"
									style={{ padding: '8px', width: '100%' }}
								/>
							</div>
						</>
					)}

					{/* Error display */}
					{importError && (
						<div style={{ padding: '12px', background: 'var(--danger-glow)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 600, marginBottom: '4px' }}>
								❌ Error
							</div>
							<div className="danger-text" style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>{importError}</div>
						</div>
					)}

					{/* Progress Section - visible during and after processing */}
					{(importLoading || importPhase === 'complete') && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
							
							{/* Phase indicator */}
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: '8px' }}>
								{importPhase === 'uploading' && <span style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>📤</span>}
								{importPhase === 'validating' && <span style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>🔍</span>}
								{importPhase === 'validated' && <span style={{ fontSize: '18px' }}>✅</span>}
								{importPhase === 'processing' && <span style={{ fontSize: '18px', animation: 'pulse 1.5s ease-in-out infinite' }}>⚙️</span>}
								{importPhase === 'complete' && <span style={{ fontSize: '18px' }}>🎉</span>}
								{importPhase === 'error' && <span style={{ fontSize: '18px' }}>❌</span>}
								<div>
									<div style={{ fontWeight: 600, fontSize: '14px' }}>
										{importPhase === 'uploading' && 'Mengunggah file...'}
										{importPhase === 'validating' && 'Memvalidasi data...'}
										{importPhase === 'validated' && `${importStats.total} baris siap diproses`}
										{importPhase === 'processing' && `Memproses ${importCurrentItem}...`}
										{importPhase === 'complete' && 'Import Selesai!'}
										{importPhase === 'error' && 'Gagal!'}
									</div>
									{importPhase === 'processing' && importStats.total > 0 && (
										<div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
											{importProgress}% — {Math.round((importStats.inserted + importStats.updated + importStats.skipped))} / {importStats.total} baris
										</div>
									)}
								</div>
							</div>

							{/* Progress bar */}
							<div style={{ width: '100%', height: '8px', background: 'var(--surface-alt)', borderRadius: '4px', overflow: 'hidden' }}>
								<div style={{
									height: '100%',
									width: `${importProgress}%`,
									background: importPhase === 'complete' ? 'linear-gradient(90deg, #28a745, #20c997)' : importPhase === 'error' ? '#d73a49' : 'linear-gradient(90deg, var(--primary), var(--primary-light, #5fa8ff))',
									borderRadius: '4px',
									transition: 'width 0.3s ease, background 0.5s ease',
								}} />
							</div>

							{/* Statistics cards */}
							{(importStats.inserted > 0 || importStats.updated > 0 || importStats.skipped > 0 || importPhase === 'complete') && (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
									<div style={{ padding: '10px', background: 'var(--success-glow)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--success)' }}>
										<div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>{importStats.inserted}</div>
										<div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Ditambahkan</div>
									</div>
									<div style={{ padding: '10px', background: 'var(--accent-glow)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--accent)' }}>
										<div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>{importStats.updated}</div>
										<div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Diperbarui</div>
									</div>
									<div style={{ padding: '10px', background: 'var(--warning-glow)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--warning)' }}>
										<div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warning)' }}>{importStats.skipped}</div>
										<div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Dilewati</div>
									</div>
								</div>
							)}

							{/* Activity log feed */}
							{importLogs.length > 0 && (
								<div style={{ 
									maxHeight: '160px', 
									overflowY: 'auto', 
									background: 'var(--surface-alt)', 
									borderRadius: '8px', 
									padding: '8px 12px',
									fontSize: '12px',
									fontFamily: 'monospace',
									border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
								}}>
									{importLogs.map((log, i) => (
										<div key={i} style={{ 
											padding: '3px 0', 
											display: 'flex', 
											alignItems: 'center', 
											gap: '8px',
											borderBottom: i < importLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
											opacity: i === importLogs.length - 1 ? 1 : 0.7,
										}}>
											<span style={{ flexShrink: 0 }}>
												{log.action === 'inserted' && '🟢'}
												{log.action === 'updated' && '🔵'}
												{log.action === 'skipped' && '🟡'}
											</span>
											<span style={{ 
												overflow: 'hidden', 
												textOverflow: 'ellipsis', 
												whiteSpace: 'nowrap',
												flex: 1,
											}}>
												{log.name}
											</span>
											<span style={{ 
												flexShrink: 0, 
												fontSize: '10px', 
												padding: '1px 6px', 
												borderRadius: '4px',
												background: log.action === 'inserted' ? 'var(--success-glow)' : log.action === 'updated' ? 'var(--accent-glow)' : 'var(--warning-glow)',
												color: log.action === 'inserted' ? 'var(--success)' : log.action === 'updated' ? 'var(--accent)' : 'var(--warning)',
											}}>
												{log.action === 'inserted' ? 'BARU' : log.action === 'updated' ? 'UPDATE' : 'SKIP'}
											</span>
										</div>
									))}
								</div>
							)}

							{/* Success message */}
							{importSuccess && (
								<div style={{ 
									padding: '12px 16px', 
									background: 'rgba(40,167,69,0.1)', 
									color: '#28a745', 
									borderRadius: '8px', 
									fontWeight: 600,
									textAlign: 'center',
									border: '1px solid rgba(40,167,69,0.25)',
								}}>
									✅ {importSuccess}
								</div>
							)}
						</div>
					)}
				</div>
			</Modal>
			<ConfirmDialog
				open={!!deleteTarget}
				title="Hapus Item ATK"
				message={deleteTarget ? `Hapus item "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.` : ''}
				confirmLabel="Hapus"
				danger
				onConfirm={confirmDeleteItem}
				onCancel={() => setDeleteTarget(null)}
			/>
		</div>
	);
};

export default AtkItems;
