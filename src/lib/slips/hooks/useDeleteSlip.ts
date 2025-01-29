import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { pb } from "src/connection/pocketbase";
import { useGetJournals } from "src/lib/journals/hooks/useGetJournals";
import { useGetSlips } from "./useGetSlips";
import type { Slip } from "../Slip.type";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";

type deleteSlipProps = {
  slipId: string;
  hardDelete?: boolean;
};

type UseDeleteSlipResponse = {
  deleteSlip: UseMutateAsyncFunction<
    string | undefined,
    Error,
    deleteSlipProps,
    unknown
  >;
};

export const useDeleteSlip = (): UseDeleteSlipResponse => {
  const queryClient = useQueryClient();
  const { slips } = useGetSlips();
  const { refetchJournals } = useGetJournals();

  const mutationFn = async ({
    slipId,
    hardDelete = false,
  }: deleteSlipProps): Promise<string | undefined> => {
    const slipToDelete = slips.find((slip) => slip.id === slipId);

    if (!slipToDelete) {
      return;
    }

    // instead of delete from db, again because its not in the db just remove it from the slips array state
    if (slipToDelete.isDraft) {
      return slipId;
    }

    if (hardDelete) {
      await pb.collection("slips").delete(slipId);
    } else {
      await pb
        .collection("slips")
        .update(slipId, { ...slipToDelete, deleted: dayjs() });
    }

    if (slipToDelete.journals.length) {
      await refetchJournals();
    }

    return slipId;
  };

  const onSuccess = (data: string | undefined) => {
    queryClient.setQueryData(["slips.list"], (currentSlips: Slip[]) =>
      data
        ? currentSlips.filter((currentSlip) => currentSlip.id !== data)
        : currentSlips
    );
  };

  // TODO: consider time caching for better performance
  const { mutateAsync } = useMutation({
    mutationKey: ["slips.delete"],
    mutationFn,
    onSuccess,
    // staleTime: 2 * 60 * 1000,
    // gcTime: 2 * 60 * 1000,
  });

  return { deleteSlip: mutateAsync };
};
