import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { pb } from "src/pocketbase/utils/pocketbaseConfig";
import { selectedTopicIdsAtom } from "src/topics/atoms/selectedTopicIdsAtom";
import type { Topic } from "../types/Topic.type";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import type { Slip } from "src/slips/types/Slip.type";

type UseDeleteTopicResponse = {
  deleteTopic: UseMutateAsyncFunction<
    string | undefined,
    Error,
    string,
    unknown
  >;
};

export const useDeleteTopic = (): UseDeleteTopicResponse => {
  const queryClient = useQueryClient();

  const selectedTopicIds = useAtomValue(selectedTopicIdsAtom);

  const deleteTopic = async (topicId: string): Promise<string | undefined> => {
    const isTopicDeleted = await pb.collection("topics").delete(topicId);

    if (isTopicDeleted) {
      return topicId;
    }

    return undefined;
  };

  // TODO: modifying times not needed yet I dont think
  const { mutateAsync } = useMutation({
    mutationKey: ["slips.delete"],
    mutationFn: deleteTopic,
    onSuccess: (data) => {
      if (!data) {
        return;
      }

      queryClient.setQueryData(["topics.list"], (currentTopics: Topic[]) => {
        return currentTopics.filter((topic) => topic.id !== data);
      });

      // remove topic from any slips
      queryClient.setQueryData(
        ["slips.list", selectedTopicIds],
        (currentSlips: Slip[]) => {
          return currentSlips.map((currentSlip) => {
            const foundCurrentSlip = currentSlip.topics.find(
              (topic) => topic.id === data
            );

            if (!foundCurrentSlip) {
              return currentSlip;
            }

            return {
              ...currentSlip,
              topics: currentSlip.topics.filter((topic) => topic.id !== data),
            };
          });
        }
      );
    },
    // staleTime: 2 * 60 * 1000,
    // gcTime: 2 * 60 * 1000,
  });

  return { deleteTopic: mutateAsync };
};
