import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "src/hooks/useIntersectionObserver";
import { useGetSlips } from "src/models/slips/hooks/useGetSlips";
import isAuthenticated from "src/models/users/utils/isAuthenticated";
import SlipCard from "src/routes/stream/-components/SlipCard";
import TableOfContents from "../../components/TableOfContents/TableOfContents";
import type { TableOfContentsItem } from "../../components/TableOfContents/TableOfContents";

export const Route = createFileRoute("/stream/")({
  component: StreamIndexComponent,
  beforeLoad: async ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: "/login",
        search: {
          // (Do not use `router.state.resolvedLocation` as it can potentially lag behind the actual current location)
          redirect: location.href,
        },
      });
    }
  },
});

function StreamIndexComponent() {
  const { slips } = useGetSlips();
  const bottomRef = useRef<null | HTMLDivElement>(null);
  const [navigationId, setNavigationId] = useState("");
  const slipRefs = useRef<HTMLDivElement[]>([]);

  useIntersectionObserver(
    slipRefs,
    (entry) => {
      setNavigationId(entry.target.id);
    },
    { rootMargin: "-10% 0% -90% 0%" },
    { disabled: false }
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "instant",
    });

    const lastSlipGroup = slips.at(slips.length - 1);

    lastSlipGroup && setNavigationId(lastSlipGroup?.title);
  }, [slips]);

  const tableOfContentItems = slips.reduce(
    (acc: TableOfContentsItem[], group) => {
      const title = group.value.format("MMMM YYYY");
      const item = acc.find((item) => item.title === title);

      const day = {
        title: group.value.format("dddd D"),
        navigationId: group.title,
        subItems: [],
      };

      if (!item) {
        acc.push({
          title,
          navigationId: null,
          subItems: [day],
        });
      } else {
        item.subItems.push(day);
      }

      return acc;
    },
    []
  );

  const length = 9000;

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full gap-10 p-6 max-w-[700px] overflow-y-auto overflow-x-hidden">
        {slips.map((group) => (
          <div
            ref={(el: HTMLDivElement | null) => {
              if (el && !slipRefs.current.includes(el)) {
                slipRefs.current.push(el);
              }
            }}
            id={group.title}
            key={group.title}
            className="flex flex-col gap-3"
          >
            <h2 className="font-title text-stone-700 text-3xl">
              {group.title}
            </h2>

            {group.slips.map((slip) => (
              <SlipCard key={slip.id} slip={slip} />
            ))}
          </div>
        ))}

        <div ref={bottomRef} className="flex justify-center">
          <h1 className="font-title text-2xl text-stone-300">
            {length} total slips
          </h1>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <TableOfContents
          items={tableOfContentItems}
          activeItemNavigationId={navigationId}
          onJumpTo={(id) => setNavigationId(id)}
        />
      </div>
    </div>
  );
}
