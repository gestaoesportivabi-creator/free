import React, { useEffect, useState } from 'react';
import { athleteInitials, athletePhotoSrc } from '../utils/athletePhoto';

interface AthleteAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
  initialsClassName?: string;
}

/**
 * Círculo de foto. Sem URL, path de storage sem host, ou onError:
 * iniciais (2 primeiras letras), no mesmo padrão do Scout Coletivo.
 */
export const AthleteAvatar: React.FC<AthleteAvatarProps> = ({
  name,
  photoUrl,
  className = '',
  initialsClassName = 'text-[10px]',
}) => {
  const src = athletePhotoSrc(photoUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 font-bold ${initialsClassName} ${className}`}
        aria-hidden
      >
        {athleteInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={`w-full h-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
};
