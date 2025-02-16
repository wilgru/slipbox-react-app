import { useQuery } from "@tanstack/react-query";
import { pb } from "src/connections/pocketbase";
import { groupSlips } from "src/models/slips/utils/groupSlips";
import { mapSlip } from "src/models/slips/utils/mapSlip";
import { mapJournal } from "../utils/mapJournal";
import type { Journal } from "../Journal.type";
import type {
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";
import type { TableOfContentsItem } from "src/components/TableOfContents/TableOfContents";
import type {
  Slip,
  SlipsGroupDividedByTitle,
} from "src/models/slips/Slip.type";

type UseJournalResponse = {
  journal: Journal | undefined;
  slips: SlipsGroupDividedByTitle[];
  tableOfContentItems: TableOfContentsItem[];
  refetchJournal: (options?: RefetchOptions | undefined) => Promise<
    QueryObserverResult<
      {
        journal: Journal;
        slips: SlipsGroupDividedByTitle[];
      },
      Error
    >
  >;
};

export const useGetJournal = (journalId: string): UseJournalResponse => {
  const queryFn = async (): Promise<{
    journal: Journal;
    slips: SlipsGroupDividedByTitle[];
    tableOfContentItems: TableOfContentsItem[];
  }> => {
    const rawJournal = await pb.collection("journals").getOne(journalId, {
      expand: "slips_via_journals, slips_via_journals.journals",
    });
    const journal: Journal = mapJournal({
      ...rawJournal,
      totalSlips: rawJournal.expand?.slips_via_journals.length ?? 0,
    });

    const rawSlips = rawJournal.expand?.slips_via_journals;
    const slips: Slip[] = rawSlips.map(mapSlip);

    const groupedSlips: SlipsGroupDividedByTitle[] = groupSlips(
      slips,
      journal.groupBy,
      true
    );

    const tableOfContentItems: TableOfContentsItem[] = groupedSlips.map(
      (slipGroup) => {
        const mappedSlipsWithNoTitle = slipGroup.slipsWithNoTitle.map(
          (slipWithNoTitle) => {
            const title = slipWithNoTitle.content.ops[0].insert;

            return {
              title: typeof title === "string" ? title : "No title",
              navigationId: slipWithNoTitle.id,
              subItems: [],
            };
          }
        );

        const mappedSlipsWithTitle = slipGroup.slipsWithTitle.map(
          (slipWithTitle) => ({
            title: slipWithTitle.title ?? "", // this should never fallback to empty string as empty titles are filtered beforehand
            navigationId: slipWithTitle.id,
            subItems: [],
          })
        );

        return {
          title: slipGroup.title,
          navigationId: null,
          subItems: [...mappedSlipsWithNoTitle, ...mappedSlipsWithTitle],
        };
      }
    );

    return {
      journal,
      slips: groupedSlips,
      tableOfContentItems,
    };
  };

  // TODO: consider time caching for better performance
  const { data, refetch } = useQuery({
    queryKey: ["journals.get", journalId],
    queryFn,
    // staleTime: 2 * 60 * 1000,
    // gcTime: 2 * 60 * 1000,
  });

  return {
    journal: data?.journal,
    slips: data?.slips ?? [],
    tableOfContentItems: data?.tableOfContentItems ?? [],
    refetchJournal: refetch,
  };
};
