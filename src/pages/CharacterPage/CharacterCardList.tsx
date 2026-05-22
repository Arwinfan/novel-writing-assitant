/**
 * 人物卡片网格列表
 */
import React from 'react';
import { Box } from '@mui/material';
import type { Character } from '../../types/character';
import { CharacterCard } from './CharacterCard';

interface CharacterCardListProps {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const CharacterCardList: React.FC<CharacterCardListProps> = ({
  characters,
  selectedId,
  onSelect,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {characters.map((char) => (
        <CharacterCard
          key={char.id}
          character={char}
          selected={char.id === selectedId}
          onSelect={() => onSelect(char.id)}
        />
      ))}
    </Box>
  );
};
