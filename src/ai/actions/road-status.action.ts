'use server';

import { roadStatusFlow, RoadStatusInput } from '../flows/road-status.flow';

export async function getRoadStatus(input: RoadStatusInput) {
  return await roadStatusFlow(input);
}
