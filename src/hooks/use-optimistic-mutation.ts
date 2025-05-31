'use client';

import { useOptimistic } from 'react';
import { useCallback } from 'react';

/**
 * A custom hook that provides optimistic updates for data mutations
 * 
 * @param initialState - The initial state to use
 * @param updateFn - A function that takes the current state and the action and returns the new state
 * @returns A tuple with the optimistic state and a function to trigger the optimistic update
 */
export function useOptimisticMutation<TState, TAction>(
  initialState: TState,
  updateFn: (state: TState, action: TAction) => TState
) {
  const [optimisticState, updateOptimisticState] = useOptimistic(
    initialState,
    updateFn
  );

  const triggerOptimistic = useCallback(
    async (
      action: TAction,
      serverAction: () => Promise<TState | void>
    ) => {
      // First, update the UI optimistically
      updateOptimisticState(action);
      
      try {
        // Then perform the actual server action
        const result = await serverAction();
        return result;
      } catch (error) {
        console.error('Error during optimistic mutation:', error);
        throw error;
      }
    },
    [updateOptimisticState]
  );

  return [optimisticState, triggerOptimistic] as const;
} 