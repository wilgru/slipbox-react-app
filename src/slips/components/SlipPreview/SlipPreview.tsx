import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "src/common/components/Button/Button";
import { DropdownMenu } from "src/common/components/DropdownMenu/DropdownMenu";
import QuillEditor from "src/common/components/QuillEditor/QuillEditor";
import { Toggle } from "src/common/components/Toggle/Toggle";
import { cleanStringCompare } from "src/common/utils/cleanStringCompare";
import { TopicPill } from "src/topics/components/TopicPill/TopicPill";
import { useTopics } from "src/topics/hooks/useTopics";
import { handleEscapeKeyDown } from "./utils/handleEscapeKeyDown";
import type { RangeStatic } from "quill";
import type { Slip } from "src/slips/types/Slip.type";
import type { Topic } from "src/topics/types/Topic.type";

type SlipPreviewProps = {
  slip: Slip;
  editMode: boolean;
  onClickEditableField?: () => void;
  onBlurEditableField?: () => void;
  onChangeSlip?: ((slip: Slip) => void) & {
    clear(): void;
  } & {
    flush(): void;
  };
};

type AnyKeyValueOfSlip = {
  [K in keyof Slip]: { [P in K]: Slip[K] };
}[keyof Slip];

const SlipPreview = ({
  slip,
  editMode,
  onClickEditableField,
  onBlurEditableField,
  onChangeSlip,
}: SlipPreviewProps) => {
  const { topics, createTopic } = useTopics();

  const [editableSlip, setEditableSlip] = useState<Slip>(slip); // cant push any changes to the actual slip itself, this will be replenished with the most recent version of the slip whenever that slip state updates
  const [updatedDateVisible, setUpdatedDateVisible] = useState<boolean>();
  const [topicToAdd, setTopicToAdd] = useState<string | undefined>(undefined);
  const [addTopicAutocompleteOptions, setAddTopicAutocompleteOptions] =
    useState<Topic[]>([]);

  const initialSlip = useMemo(() => slip, [slip.id]); // capture the slip to set as the initial slip only when the slip to preview changes

  const onChangeSlipInternal = (
    changedField: AnyKeyValueOfSlip,
    flush: boolean = false
  ) => {
    setEditableSlip((currentEditableSlip) => {
      const newSlipDelta = { ...currentEditableSlip, ...changedField };

      onChangeSlip && onChangeSlip(newSlipDelta);

      flush && onChangeSlip?.flush(); // as in trigger debounced function immediately

      return newSlipDelta;
    });
  };

  const onSelectionChange = (range: RangeStatic, oldRange: RangeStatic) => {
    if (range === null && oldRange !== null) {
      onBlurEditableField && onBlurEditableField();
    } else if (range !== null && oldRange === null) {
      onClickEditableField && onClickEditableField();
    }
  };

  const onChangeTopicToAdd = async (topicToAdd: string) => {
    setTopicToAdd(topicToAdd);

    let newThing = [];

    const a = topics.filter((topic) =>
      cleanStringCompare(topic.name, topicToAdd, "like")
    );

    newThing = a;

    const exactTopicFound = topics.find((topic) =>
      cleanStringCompare(topic.name, topicToAdd)
    );

    if (!exactTopicFound) {
      newThing.push({ name: `Create '${topicToAdd}'`, id: "CREATE_NEW" });
    }

    setAddTopicAutocompleteOptions(newThing);
  };

  const onSubmitAddTopic = async (selectedTopic: {
    name: string;
    id: string;
  }) => {
    if (editableSlip.topics.some((topic) => topic.id === selectedTopic.id)) {
      setTopicToAdd(undefined);
      return;
    }

    if (topics.find((topic) => topic.id === selectedTopic.id)) {
      onChangeSlipInternal({ topics: [...editableSlip.topics, selectedTopic] });
      setTopicToAdd(undefined);
      return;
    }

    if (topicToAdd) {
      const newTopic = await createTopic(topicToAdd);
      onChangeSlipInternal({ topics: [...editableSlip.topics, newTopic] });
      setTopicToAdd(undefined);
      return;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
          {
            // TODO move to own handler like the other ones?
            e.preventDefault();

            const existingTopic = topics.find(
              (topic) =>
                topicToAdd && cleanStringCompare(topic.name, topicToAdd)
            );

            existingTopic && onSubmitAddTopic(existingTopic);
          }
          break;

        case "Escape":
          handleEscapeKeyDown();
          setTopicToAdd(undefined);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [topicToAdd, topics]);

  useEffect(() => {
    console.log(slip.title); //TODO: fix title not removing on clicking new slip if a slip was already open
    setEditableSlip(slip);
  }, [slip]);

  return (
    // TODO: if any issues, I removed a fragment that was here
    <div
      className={
        "flex-grow flex flex-col gap-2 w-full p-2 mb-1 bg-stone-100 border border-stone-700 shadow-light"
      }
    >
      <div className="flex flex-row items-start">
        <div className="flex-grow flex flex-col">
          <textarea
            value={editableSlip.title ?? undefined} // TODO maybe set this to "" instead of undefined
            placeholder="No Title"
            onChange={(e) => onChangeSlipInternal({ title: e.target.value })}
            onClick={onClickEditableField}
            onBlur={onBlurEditableField}
            className="h-10 w-full text-4xl font-normal font-title tracking-tight overflow-y-hidden bg-stone-100 text-stone-700 placeholder-stone-500 border-stone-700 select-none resize-none outline-none"
          />
          <div className="flex flex-row gap-2">
            <p
              className="text-stone-500 text-xs"
              onMouseEnter={() => setUpdatedDateVisible(true)}
              onMouseLeave={() => setUpdatedDateVisible(false)}
            >
              {editableSlip.created.format("ddd D MMMM YYYY, hh:mm a")}
            </p>
            <p
              className={`${
                updatedDateVisible ? "visible" : "hidden"
              } text-stone-500 text-xs italic`}
            >
              {"(Last edited " +
                editableSlip.updated.format("ddd D MMMM YYYY, hh:mm a") +
                ")"}
            </p>
          </div>
        </div>

        <div className=" flex flex-row gap-2">
          <Toggle
            styleType="icon"
            icon="pin"
            iconToggledOnColour="red-500"
            isToggled={editableSlip.isPinned}
            onClick={() =>
              onChangeSlipInternal({ isPinned: !editableSlip.isPinned }, true)
            }
          />
          <Toggle
            styleType="icon"
            icon="flag"
            iconToggledOnColour="orange-500"
            isToggled={editableSlip.isFlagged}
            onClick={() =>
              onChangeSlipInternal({ isFlagged: !editableSlip.isFlagged }, true)
            }
          />
          <Button
            styleType="icon"
            icon="bin"
            onClick={() => onChangeSlipInternal({ deleted: dayjs() }, true)}
          ></Button>
        </div>
      </div>

      <div className="flex flex-row gap-2">
        {editableSlip.topics.map((topic) => {
          return <TopicPill name={topic.name} />;
        })}

        <DropdownMenu
          options={addTopicAutocompleteOptions}
          visible={!!topicToAdd && !!addTopicAutocompleteOptions.length}
          onClick={(selectedTopic) => {
            onSubmitAddTopic(selectedTopic);
          }}
        >
          <div className="flex justify-center h-full">
            <textarea
              value={topicToAdd ?? ""}
              placeholder="Add topic..."
              onClick={onClickEditableField}
              onBlur={onBlurEditableField}
              onChange={(e) => onChangeTopicToAdd(e.target.value)}
              className="text-xs h-4 my-auto overflow-y-hidden bg-stone-100 text-stone-700 placeholder-stone-500 border-stone-700 select-none resize-none outline-none"
            >
              add topic...
            </textarea>
          </div>
        </DropdownMenu>
      </div>

      <QuillEditor
        initialValue={initialSlip.content}
        onSelectionChange={onSelectionChange}
        onTextChange={(delta) => onChangeSlipInternal({ content: delta })}
      />
      {
        editMode && (
          <p className="text-orange-500">EDIT MODE</p>
        ) /* TODO: remove this element*/
      }
    </div>
  );
};

export default SlipPreview;
