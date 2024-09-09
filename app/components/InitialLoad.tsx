import { Headphones } from "./Headphones";
import { isBrowser } from "react-device-detect";
import { Avatar, Select, SelectItem, Spinner } from "@nextui-org/react";
import { Dispatch, SetStateAction, useState } from "react";
import { models, voices } from "../context/WebScoket";

const arrayOfVoices = Object.entries(voices).map((e) => ({
  ...e[1],
  model: e[0],
}));

const itemClasses = {
  base: [
    "rounded-md",
    "text-default-500",
    "transition-opacity",
    "data-[hover=true]:text-foreground",
    "data-[hover=true]:bg-default-100",
    "data-[hover=true]:bg-default-50",
    "data-[selectable=true]:focus:bg-default-50",
    "data-[pressed=true]:opacity-70",
    "data-[focus-visible=true]:ring-default-500",
  ],
};

const classNames = {
    base: "before:bg-default-200",
    content: "p-0 border-small border-divider bg-background",
  };

export const VoiceSelection = ({
  model,
  setModel,
}: {
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <Select
      defaultSelectedKeys={["aura-model-asteria"]}
      selectedKeys={[model]}
      onSelectionChange={(keys: any) =>
        setModel(keys.entries().next().value[0])
      }
      items={arrayOfVoices}
      label="Selected voice"
      color="default"
      variant="bordered"
      classNames={{
        label: "group-data-[filled=true]:-translate-y-5",
        trigger: "min-h-unit-16",
        listboxWrapper: "max-h-[400px]",
      }}
      listboxProps={{
        itemClasses,
      }}
      popoverProps={{
        classNames
      }}
      renderValue={(items) => {
        return items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <Avatar
              alt={item.data?.name}
              className="flex-shrink-0"
              size="sm"
              src={item.data?.avatar}
            />
            <div className="flex flex-col">
              <span>{item.data?.name}</span>
              <span className="text-default-500 text-tiny">
                ({item.data?.model} - {item.data?.language} {item.data?.accent})
              </span>
            </div>
          </div>
        ));
      }}
    >
      {(model) => (
        <SelectItem key={model.model} textValue={model.model} color="default">
          <div className="flex gap-2 items-center">
            <Avatar
              alt={model.name}
              className="flex-shrink-0"
              size="sm"
              src={model.avatar}
            />
            <div className="flex flex-col">
              <span className="text-small">{model.name}</span>
              <span className="text-tiny text-default-400">
                {model.model} - {model.language} {model.accent}
              </span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  );
};


export const ModelSelection = ({
  model,
  setModel,
}: {
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <Select
      defaultSelectedKeys={["aura-model-asteria"]}
      selectedKeys={[model]}
      onSelectionChange={(keys: any) =>
        setModel(keys.entries().next().value[0])
      }
      items={models}
      label="Selected model"
      color="default"
      variant="bordered"
      classNames={{
        label: "group-data-[filled=true]:-translate-y-5",
        trigger: "min-h-unit-16",
        listboxWrapper: "max-h-[400px]",
      }}
      listboxProps={{
        itemClasses,
      }}
      popoverProps={{
        classNames
      }}
      renderValue={(items) => {
        return items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div className="flex flex-col">
              <span>{item.data?.name}</span>
              <span className="text-default-500 text-tiny">
                ({item.data?.value})
              </span>
            </div>
          </div>
        ));
      }}
    >
      {(model) => (
        <SelectItem key={model.value} textValue={model.value} color="default">
          <div className="flex gap-2 items-center">
            <div className="flex flex-col">
              <span className="text-small">{model.name}</span>
              <span className="text-tiny text-default-400">
                {model.value}
              </span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  );
};

export const InitialLoad = ({ fn, connecting = true }: { fn: () => void, connecting: boolean }) => {
  const [selectedVoice, setSelectedVoice] = useState(arrayOfVoices[0]?.model);
  const [selectedModel, setSelectedModel] = useState(models[0]?.value);

  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <div
          // disabled={connecting}
          // onClick={() => !connecting && fn()}
          // type="button"
          className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl"
        >
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100">
            Welcome to Deepgram&apos;s
            <br />
            AI Agent Tech Demo.
          </h2>
          <div className=" mt-4 space-y-4">
            <VoiceSelection model={selectedVoice} setModel={setSelectedVoice} />
            <ModelSelection model={selectedModel} setModel={setSelectedModel} />
          </div>
          <span className="mt-4 block font-semibold">
            <div className="bg-white text-black rounded px-6 md:px-8 py-3 font-semibold sm:w-fit sm:mx-auto opacity-90">
              {connecting ? (
                <div className="w-full h-full items-center flex justify-center opacity-40 cursor-not-allowed">
                  <Spinner size={"sm"} className="-mt-1 mr-2" />
                  Connecting...
                </div>
              ) : (
                <div className="w-full h-full items-center flex justify-center opacity-40 cursor-not-allowed">
                  Listening...
                </div>
              )}
            </div>
          </span>
          <span className="mt-4 block text-sm text-gray-100/70">
            <Headphones /> For optimal enjoyment, we recommend using headphones
            while using this application. Minor bugs and annoyances may appear
            while using this demo. Pull requests are welcome.
          </span>
        </div>
      </div>
    </>
  );
};
