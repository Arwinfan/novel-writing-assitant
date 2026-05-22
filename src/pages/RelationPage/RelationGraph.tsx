/**
 * ReactFlow 人物关系图 - 完整交互版
 * 支持节点拖拽、边点击编辑、右键菜单、双击创建
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Character } from '../../types/character';
import type { Relation } from '../../types/relation';
import { CharacterNode } from './CharacterNode';
import { RelationEdge } from './RelationEdge';
import { RelationDialog } from './RelationDialog';

interface RelationGraphInnerProps {
  characters: Character[];
  relations: Relation[];
  onEditRelation: (id: string, relationType: string, description: string) => void;
  onDeleteRelation: (id: string) => void;
  onAddRelation: (sourceId: string, targetId: string, relationType: string, description: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  onEditCharacter: (character: Character) => void;
}

const RelationGraphInner: React.FC<RelationGraphInnerProps> = ({
  characters,
  relations,
  onEditRelation,
  onDeleteRelation,
  onAddRelation,
  onDeleteCharacter,
  onEditCharacter,
}) => {
  const [addRelSourceId, setAddRelSourceId] = useState<string | null>(null);
  const [addRelDialogOpen, setAddRelDialogOpen] = useState(false);

  const nodeTypes: NodeTypes = useMemo(() => ({
    character: CharacterNode as any,
  }), []);

  const edgeTypes = useMemo(() => ({
    relation: RelationEdge as any,
  }), []);

  const initialNodes: Node[] = useMemo(() => {
    return characters.map((char, index) => {
      const angle = (2 * Math.PI * index) / Math.max(characters.length, 1);
      const radius = Math.max(200, characters.length * 40);
      return {
        id: char.id,
        type: 'character',
        position: { x: 400 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) },
        data: {
          character: char,
          onEdit: (c: Character) => onEditCharacter(c),
          onDelete: (id: string) => onDeleteCharacter(id),
          onAddRelation: (id: string) => {
            setAddRelSourceId(id);
            setAddRelDialogOpen(true);
          },
        },
      };
    });
  }, [characters, onEditCharacter, onDeleteCharacter]);

  const initialEdges: Edge[] = useMemo(() => {
    return relations.map((rel) => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      type: 'relation',
      data: {
        relation: rel,
        onEdit: (id: string, type: string, desc: string) => onEditRelation(id, type, desc),
        onDelete: (id: string) => onDeleteRelation(id),
      },
    }));
  }, [relations, onEditRelation, onDeleteRelation]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleAddRelationConfirm = async (sourceId: string, targetId: string, relationType: string, description: string) => {
    await onAddRelation(sourceId, targetId, relationType, description);
    setAddRelDialogOpen(false);
    setAddRelSourceId(null);
  };

  const filteredTargetCharacters = addRelSourceId
    ? characters.filter((c) => c.id !== addRelSourceId)
    : characters;

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: false,
        }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          nodeColor={() => '#1976d2'}
        />
      </ReactFlow>

      {/* 添加关系弹窗 */}
      <RelationDialog
        open={addRelDialogOpen}
        characters={filteredTargetCharacters}
        defaultSourceId={addRelSourceId ?? undefined}
        onConfirm={handleAddRelationConfirm}
        onCancel={() => {
          setAddRelDialogOpen(false);
          setAddRelSourceId(null);
        }}
      />
    </>
  );
};

/** 包装组件（需要 ReactFlowProvider） */
interface RelationGraphProps {
  characters: Character[];
  relations: Relation[];
  onEditRelation: (id: string, relationType: string, description: string) => void;
  onDeleteRelation: (id: string) => void;
  onAddRelation: (sourceId: string, targetId: string, relationType: string, description: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  onEditCharacter: (character: Character) => void;
}

export const RelationGraph: React.FC<RelationGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RelationGraphInner {...props} />
    </ReactFlowProvider>
  );
};
