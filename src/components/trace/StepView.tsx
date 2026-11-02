import type { TraceStep } from '@/engine/trace';
import { StepViewSimulate } from './StepViewSimulate';
import type { SimulateStepData } from './StepViewSimulate';
import { StepViewSubset } from './StepViewSubset';
import type { SubsetStepData } from './StepViewSubset';
import { StepViewMinimize } from './StepViewMinimize';
import type { MinimizeStepData } from './StepViewMinimize';
import { StepViewThompson } from './StepViewThompson';
import type { ThompsonStepData } from './StepViewThompson';
import { StepViewArden } from './StepViewArden';
import type { ArdenStepData } from './StepViewArden';
import { StepViewParser } from './StepViewParser';
import type { ParserStepData } from './StepViewParser';
import { StepViewPumping } from './StepViewPumping';
import type { PumpingStepData } from './StepViewPumping';
import { StepViewTransducer } from './StepViewTransducer';
import type { TransducerStepData } from './StepViewTransducer';

interface StepViewProps {
  step: TraceStep;
}

export function StepView({ step }: StepViewProps) {
  // Registry of step renderers by data.kind
  const kind = (step.data as { kind?: string })?.kind;

  switch (kind) {
    case 'simulate':
      return <StepViewSimulate step={step as TraceStep<SimulateStepData>} />;
    case 'subset':
      return <StepViewSubset step={step as TraceStep<SubsetStepData>} />;
    case 'minimize':
      return <StepViewMinimize step={step as TraceStep<MinimizeStepData>} />;
    case 'thompson':
      return <StepViewThompson step={step as TraceStep<ThompsonStepData>} />;
    case 'arden':
      return <StepViewArden step={step as TraceStep<ArdenStepData>} />;
    case 'parser':
      return <StepViewParser step={step as TraceStep<ParserStepData>} />;
    case 'pumping':
      return <StepViewPumping step={step as TraceStep<PumpingStepData>} />;
    case 'transducer':
      return <StepViewTransducer step={step as TraceStep<TransducerStepData>} />;
    default:
      // Generic fallback for unknown step types
      return (
        <div className="rounded bg-gray-50 dark:bg-gray-800 p-3">
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(step.data, null, 2)}
          </pre>
        </div>
      );
  }
}
