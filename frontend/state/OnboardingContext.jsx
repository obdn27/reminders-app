import { createContext, useContext, useMemo, useState } from 'react';
import { ANCHOR_CATALOG, buildAnchorDraft } from '../data/anchorCatalog';

const OnboardingContext = createContext(null);

const DEFAULT_STATE = {
  goalContext: '',
  selectedAnchors: [],
  anchorDrafts: {},
  tonePreference: 'neutral',
};

function ensureAnchorDrafts(anchorTypes, currentDrafts) {
  const nextDrafts = {};

  anchorTypes.forEach((anchorType) => {
    nextDrafts[anchorType] = currentDrafts[anchorType] || buildAnchorDraft(anchorType);
  });

  return nextDrafts;
}

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);

  const setGoalContext = (goalContext) => {
    setState((current) => ({ ...current, goalContext }));
  };

  const toggleAnchor = (anchorType) => {
    setState((current) => {
      const alreadySelected = current.selectedAnchors.includes(anchorType);
      let nextSelectedAnchors;

      if (alreadySelected) {
        nextSelectedAnchors = current.selectedAnchors.filter((item) => item !== anchorType);
      } else if (current.selectedAnchors.length < 4) {
        nextSelectedAnchors = [...current.selectedAnchors, anchorType];
      } else {
        nextSelectedAnchors = current.selectedAnchors;
      }

      return {
        ...current,
        selectedAnchors: nextSelectedAnchors,
        anchorDrafts: ensureAnchorDrafts(nextSelectedAnchors, current.anchorDrafts),
      };
    });
  };

  const setSelectedAnchors = (anchorTypes) => {
    setState((current) => ({
      ...current,
      selectedAnchors: anchorTypes,
      anchorDrafts: ensureAnchorDrafts(anchorTypes, current.anchorDrafts),
    }));
  };

  const updateAnchorDraft = (anchorType, patch) => {
    setState((current) => ({
      ...current,
      anchorDrafts: {
        ...current.anchorDrafts,
        [anchorType]: {
          ...(current.anchorDrafts[anchorType] || buildAnchorDraft(anchorType)),
          ...patch,
        },
      },
    }));
  };

  const setTonePreference = (tonePreference) => {
    setState((current) => ({ ...current, tonePreference }));
  };

  const resetOnboarding = () => {
    setState(DEFAULT_STATE);
  };

  const selectedAnchorDrafts = useMemo(
    () =>
      state.selectedAnchors
        .map((anchorType) => state.anchorDrafts[anchorType] || buildAnchorDraft(anchorType))
        .filter(Boolean),
    [state.selectedAnchors, state.anchorDrafts]
  );

  const selectedAnchorDefinitions = useMemo(
    () =>
      state.selectedAnchors
        .map((anchorType) => ANCHOR_CATALOG.find((item) => item.type === anchorType))
        .filter(Boolean),
    [state.selectedAnchors]
  );

  const value = useMemo(
    () => ({
      state,
      setGoalContext,
      toggleAnchor,
      setSelectedAnchors,
      updateAnchorDraft,
      setTonePreference,
      resetOnboarding,
      selectedAnchorDrafts,
      selectedAnchorDefinitions,
    }),
    [state, selectedAnchorDrafts, selectedAnchorDefinitions]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return context;
}

