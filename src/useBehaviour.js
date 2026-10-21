import { useMemo } from 'react';
import { buildProfiles, trainModel, scoreCustomers, buyingPatterns, churnPatterns } from './behaviour.mjs';

// Everything the monitor and studio derive from the active behaviour records, computed once per dataset/scope.
export function useBehaviour(records) {
  return useMemo(() => {
    const profiles = buildProfiles(records), model = trainModel(profiles);
    return {records, profiles, model, scored:scoreCustomers(profiles, model), patterns:buyingPatterns(records), churn:churnPatterns(profiles),
      method:model ? `Logistic regression trained on ${model.trainedOn.toLocaleString('en-US')} labelled customers` : 'Behaviour rules (no churn labels to train on)'};
  }, [records]);
}
