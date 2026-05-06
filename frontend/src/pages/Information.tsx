import { useEffect, useState } from 'react';
import { fetchActiveAnnouncements, AnnouncementRow } from '../api/announcements.api';
import { formatDateV2 } from '../utils/dateUtils';
import { SkeletonCard } from '../components/ui/Skeleton';

const Information = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);


  useEffect(() => {
    let mounted = true;
    setAnnouncementsLoading(true);
    fetchActiveAnnouncements()
      .then((rows) => {
        if (!mounted) return;
        setAnnouncements(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setAnnouncements([]);
      })
      .finally(() => {
        if (!mounted) return;
        setAnnouncementsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);


  return (
    <div className="history-page">
      <section className="information-announcements">
        <div className="information-announcements__header">
          <div>
            <span className="announcements-eyebrow">Info Terbaru</span>
            <h2 className="history-title">Pengumuman Aktif</h2>
          </div>
        </div>
        {announcementsLoading ? (
          <div className="information-announcement-grid" aria-busy="true">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : announcements.length === 0 ? (
          <div className="information-empty-note">Belum ada pengumuman aktif saat ini.</div>
        ) : (
          <div className="information-announcement-grid">
            {announcements.map((item) => (
              <article className="information-announcement-card" key={item.id}>
                <div>
                  <span>{formatDateV2(item.created_at)}</span>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Information;
