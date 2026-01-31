// src/pages/ReplayPage.tsx

import { useParams } from 'react-router-dom';

export function ReplayPage() {
  const { gameId } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">기보 복기</h2>
      <p className="text-gray-500">게임 ID: {gameId}</p>
      <p className="text-gray-500">복기 화면 (6단계에서 구현)</p>
    </div>
  );
}
