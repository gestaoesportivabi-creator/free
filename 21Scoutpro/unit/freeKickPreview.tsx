import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FreeKickEventButton } from '../components/FreeKickEventButton';

const SYNC_MESSAGE =
  'Necessário sincronizar o relógio. Esta partida não possui snapshot temporal salvo.';

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') ?? 'fouls';
  const [clicks, setClicks] = useState(0);
  const realtimeLocked = mode === 'realtime' || mode === 'both';
  const foulsFor = mode === 'enabled' || mode === 'realtime' ? 6 : mode === 'fouls' ? 4 : 0;
  const foulsAgainst = mode === 'fouls' ? 3 : 0;

  return (
    <main style={{ width: 280, padding: '140px 24px 24px', background: '#000', minHeight: '100vh' }}>
      <FreeKickEventButton
        foulsFor={foulsFor}
        foulsAgainst={foulsAgainst}
        realtimeLocked={realtimeLocked}
        realtimeMessage={SYNC_MESSAGE}
        active={false}
        onSelect={() => setClicks((count) => count + 1)}
      />
      <output data-testid="freekick-clicks">{clicks}</output>
    </main>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Preview />);
}
