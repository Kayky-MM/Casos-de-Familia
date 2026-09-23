export type RefreshTrigger = {
    trigger: 'update' | 'add' | 'click';
    relationsChanged: boolean;
    personId: string;
    removedFatherId?: string | null;
    removedMotherId?: string | null;
    removedConjugeId?: string | null;
} | {
    trigger: 'delete' | 'inject',
    personId: string;
}