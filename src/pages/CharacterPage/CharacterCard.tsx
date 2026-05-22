/**
 * 人物卡片
 */
import React from 'react';
import { Card, CardContent, Typography, Box, Chip, CardActionArea } from '@mui/material';
import type { Character } from '../../types/character';

interface CharacterCardProps {
  character: Character;
  selected: boolean;
  onSelect: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, selected, onSelect }) => {
  return (
    <Card
      sx={{
        mb: 1,
        border: selected ? 2 : 0,
        borderColor: 'primary.main',
      }}
      elevation={selected ? 3 : 1}
    >
      <CardActionArea onClick={onSelect}>
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {character.name.charAt(0)}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {character.name}
                {character.alias && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    （{character.alias}）
                  </Typography>
                )}
              </Typography>
              {character.faction && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {character.faction}
                </Typography>
              )}
            </Box>
          </Box>
          {character.tags.length > 0 && (
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {character.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
              ))}
              {character.tags.length > 3 && (
                <Chip label={`+${character.tags.length - 3}`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
