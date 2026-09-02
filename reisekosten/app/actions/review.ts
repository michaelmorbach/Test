'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireApprover } from '@/lib/dal';
import { approveTrip, returnTrip, takeTripForReview } from '@/lib/repo/trips';
import type { ActionState } from '@/app/actions/trips';

export async function takeForReviewAction(tripId: string): Promise<void> {
  const user = await requireApprover();
  takeTripForReview(tripId, user.id);
  revalidatePath('/freigaben');
  revalidatePath(`/reisekosten/${tripId}`);
}

export async function approveTripAction(
  tripId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireApprover();
  const comment = String(formData.get('comment') ?? '').trim();
  const success = approveTrip(tripId, user.id, comment || undefined);
  if (!success) {
    return { error: 'Diese Reise befindet sich nicht (mehr) bei dir in Prüfung.' };
  }
  revalidatePath('/freigaben');
  revalidatePath(`/reisekosten/${tripId}`);
  return {};
}

const ReturnSchema = z.object({
  comment: z.string().trim().min(3, 'Bitte einen Kommentar angeben, welche Änderungen nötig sind.'),
});

export async function returnTripAction(
  tripId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireApprover();
  const validated = ReturnSchema.safeParse({ comment: formData.get('comment') });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte einen Kommentar angeben.' };
  }
  const success = returnTrip(tripId, user.id, validated.data.comment);
  if (!success) {
    return { error: 'Diese Reise befindet sich nicht (mehr) bei dir in Prüfung.' };
  }
  revalidatePath('/freigaben');
  revalidatePath(`/reisekosten/${tripId}`);
  return {};
}
