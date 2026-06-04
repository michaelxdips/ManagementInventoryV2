

export function getStatusLabel(status: string | undefined | null, t: any) {
  if (!status) return status;
  switch (status.toUpperCase()) {
    case 'PENDING':
      return t('status.pending');
    case 'APPROVAL_REVIEW':
    case 'REVIEW':
      return t('status.review');
    case 'APPROVED':
      return t('status.approved');
    case 'REJECTED':
      return t('status.rejected');
    case 'DRAFT':
      return t('status.draft');
    case 'FINALIZED':
      return t('status.finalized');
    default:
      return status;
  }
}
