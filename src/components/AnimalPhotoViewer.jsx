import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import './AnimalPhotoViewer.css';

export default function AnimalPhotoViewer({ photos, initialIndex, name, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(initialIndex);
  const [failedUrl, setFailedUrl] = useState(null);
  const currentIndex = Math.min(index, photos.length - 1);
  const changePhoto = direction => setIndex(current => (current + direction + photos.length) % photos.length);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="animal-photo-viewer" aria-label={`${name || 'Animal'} full photos`}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={event => {
        if (photos.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault(); changePhoto(event.key === 'ArrowRight' ? 1 : -1);
        }
      }}>
      <div className="animal-photo-content">
        <header><div><strong>{name || 'Animal'} / PHOTOS</strong><span>Full image · {currentIndex + 1} of {photos.length}</span></div><button type="button" onClick={onClose} aria-label="Close full photo"><X size={22} /></button></header>
        <div className="animal-photo-stage">
          {failedUrl === photos[currentIndex] ? <p role="status">This photo could not load. Try another photo or reopen the viewer.</p> :
            <img key={photos[currentIndex]} src={photos[currentIndex]} alt={`${name || 'Animal'}, full photo ${currentIndex + 1}`} onError={() => setFailedUrl(photos[currentIndex])} />}
        </div>
        <footer><span>Original proportions. Every detail.</span>{photos.length > 1 && <div><button type="button" onClick={() => changePhoto(-1)} aria-label="Previous animal photo"><ArrowLeft size={18} />PREV</button><button type="button" onClick={() => changePhoto(1)} aria-label="Next animal photo">NEXT<ArrowRight size={18} /></button></div>}</footer>
      </div>
    </dialog>, document.body
  );
}
