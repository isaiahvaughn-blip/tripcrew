import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { Download } from "lucide-react";
import { P, S } from "../constants";
import ConfirmModal from "./ConfirmModal";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";

function UploadsTab({ trip, user, profile, onPreview }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [confirmDeletePhotos, setConfirmDeletePhotos] = useState(false);
  const fileInputRef = useRef(null);
  const longPressTimers = useRef({});

  useEffect(() => {
    fetchPhotos();
    const subscription = supabase.channel(`photos:${trip.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => fetchPhotos())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [trip.id]);

  const fetchPhotos = async () => {
    const { data, error } = await supabase.from('photos').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false });
    if (error) { console.error(error); return; }

    // Build a map of user_id → display_name for all uploaders
    const uploaderIds = [...new Set((data || []).map(ph => ph.user_id).filter(Boolean))];
    const uploaderMap = {};
    if (uploaderIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', uploaderIds);
      (profiles || []).forEach(p => { if (p.display_name) uploaderMap[p.id] = p.display_name; });
    }

    // Generate signed URLs (1 hour expiry) + resolve uploader name live
    const withSignedUrls = await Promise.all((data || []).map(async (ph) => {
      const { data: signed } = await supabase.storage.from('trip-photos').createSignedUrl(ph.storage_path, 3600);
      const resolvedUploader = (ph.user_id && uploaderMap[ph.user_id]) || ph.uploader || 'Unknown';
      return { ...ph, url: signed?.signedUrl || ph.url, uploader: resolvedUploader };
    }));
    setPhotos(withSignedUrls);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const validExts = ['jpg','jpeg','png','gif','webp','heic','heif'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) { alert('Please upload an image file (jpg, png, gif, webp, heic)'); return; }
    setUploading(true);
    try {
      // Compress before upload
      let fileToUpload = file;
      if (['jpg','jpeg','png','webp'].includes(ext)) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
      }

      const uploadExt = file.name.split('.').pop();
      const path = `${trip.id}/${Date.now()}.${uploadExt}`;
      const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, fileToUpload);
      if (uploadError) throw uploadError;
      const uploader = profile?.display_name || user?.email?.split('@')[0] || 'Me';
      const { error: dbError } = await supabase.from('photos').insert([{
        trip_id: trip.id, user_id: user?.id, storage_path: path,
        url: '', caption: file.name.split('.')[0], uploader, sensitive: false
      }]);
      if (dbError) throw dbError;
      await fetchPhotos();
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const toggleSensitive = async (photo) => {
    const { error } = await supabase.from('photos').update({ sensitive: !photo.sensitive }).eq('id', photo.id);
    if (!error) setPhotos(p => p.map(ph => ph.id === photo.id ? { ...ph, sensitive: !ph.sensitive } : ph));
  };
  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      const ph = photos.find(p => p.id === id);
      if (ph) {
        await supabase.storage.from('trip-photos').remove([ph.storage_path]);
        await supabase.from('photos').delete().eq('id', id);
      }
    }
    setPhotos(p => p.filter(ph => !selectedIds.includes(ph.id)));
    setSelectedIds([]); setSelecting(false); setConfirmDeletePhotos(false);
  };

  const handleMarkSensitiveSelected = async () => {
    for (const id of selectedIds) {
      const ph = photos.find(p => p.id === id);
      if (ph) await supabase.from('photos').update({ sensitive: !ph.sensitive }).eq('id', id);
    }
    await fetchPhotos();
    setSelectedIds([]); setSelecting(false);
  };

  const downloadPhotos = async (photosToDownload) => {
    if (!photosToDownload.length) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(trip.name || "vouze-photos");
      await Promise.all(photosToDownload.map(async (ph, i) => {
        const res = await fetch(ph.url);
        const blob = await res.blob();
        const ext = ph.storage_path.split('.').pop() || 'jpg';
        const filename = `${String(i + 1).padStart(2, '0')}-${ph.caption || 'photo'}.${ext}`;
        folder.file(filename, blob);
      }));
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${trip.name || "vouze"}-photos.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { console.error(e); } finally { setDownloadingAll(false); }
  };

  const handleDownloadSelected = () => {
    const selected = photos.filter(ph => selectedIds.includes(ph.id));
    downloadPhotos(selected);
  };

  const handleDownloadAll = () => {
    const nonSensitive = photos.filter(ph => !ph.sensitive);
    downloadPhotos(nonSensitive);
  };

  const handleLongPressStart = (id) => {
    longPressTimers.current[id] = setTimeout(() => {
      setSelecting(true);
      setSelectedIds([id]);
    }, 700);
  };
  const handleLongPressEnd = (id) => { clearTimeout(longPressTimers.current[id]); };

  const handleTap = (ph) => {
    if (selecting) {
      setSelectedIds(prev => prev.includes(ph.id) ? prev.filter(x => x !== ph.id) : [...prev, ph.id]);
    } else {
      onPreview({ ...ph, onToggleSensitive: () => toggleSensitive(ph) });
    }
  };

  const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); };

  return (
    <div style={S.tabScroll}>
      {confirmDeletePhotos && (
        <ConfirmModal
          message={`Remove ${selectedIds.length} photo${selectedIds.length > 1 ? 's' : ''}?`}
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmDeletePhotos(false)}
          confirmLabel="Remove"
          danger
        />
      )}

      <div style={S.tabTopRow}>
        <div style={S.tabTitle}>Memories</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {selecting ? (
            <>
              <button style={{ ...S.actionBtn, color: P.slateBlue }} onClick={() => { setSelecting(false); setSelectedIds([]); }}>Cancel</button>
              {selectedIds.length > 0 && <>
                <button style={{ ...S.actionBtn, borderColor: P.lightBlue + "60", color: P.lightBlue }}
                  onClick={handleDownloadSelected} disabled={downloadingAll}>
                  <Download size={13} />
                </button>
                <button style={{ ...S.actionBtn, borderColor: P.terracotta + "60", color: P.terracotta }}
                  onClick={handleMarkSensitiveSelected}>🔒</button>
                <button style={{ ...S.actionBtn, borderColor: P.danger + "60", color: P.danger }}
                  onClick={() => setConfirmDeletePhotos(true)}>Remove</button>
              </>}
            </>
          ) : (
            <>
              {photos.length > 0 && (
                <button
                  style={{ ...S.actionBtn, borderColor: P.lightBlue + "60", color: P.lightBlue }}
                  onClick={handleDownloadAll}
                  disabled={downloadingAll}>
                  {downloadingAll ? "..." : <Download size={13} />}
                </button>
              )}
              <button style={S.newBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "+ Upload"}
              </button>
            </>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleUpload(e.target.files[0])} />

      <div style={{ fontSize: 12, color: P.textMuted, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
        Tap to preview · Hold to select · 🔒 = sensitive
      </div>

      {photos.length === 0 && !uploading && (
        <div style={{ ...S.uploadDrop, marginBottom: 16 }} onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          <div style={S.uploadIcon}>📎</div>
          <div style={S.uploadText}>Drop your first photo here</div>
          <div style={S.uploadSub}>Tap to browse or drag and drop</div>
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 16 }}>
          {photos.map(ph => {
            const isSelected = selectedIds.includes(ph.id);
            return (
              <div key={ph.id}
                style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", cursor: "pointer", opacity: ph.sensitive ? 0.5 : 1, outline: isSelected ? `2px solid ${P.terracotta}` : "none", transition: "opacity 0.15s, transform 0.15s", transform: isSelected ? "scale(0.94)" : "scale(1)" }}
                onClick={() => handleTap(ph)}
                onTouchStart={() => handleLongPressStart(ph.id)} onTouchEnd={() => handleLongPressEnd(ph.id)}
                onMouseDown={() => handleLongPressStart(ph.id)} onMouseUp={() => handleLongPressEnd(ph.id)} onMouseLeave={() => handleLongPressEnd(ph.id)}>
                <img src={ph.url} alt={ph.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {ph.sensitive && <div style={{ position: "absolute", top: 4, right: 4, fontSize: 10 }}>🔒</div>}
                {isSelected && (
                  <div style={{ position: "absolute", inset: 0, background: P.terracotta + "30", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: P.terracotta, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {photos.length > 0 && !selecting && (
        <div style={{ ...S.uploadDrop, marginBottom: 16 }} onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          <div style={S.uploadIcon}>📎</div>
          <div style={S.uploadText}>Add more</div>
          <div style={S.uploadSub}>Photos, receipts, anything</div>
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

export default UploadsTab;