import {
  executeGameplayCommand,
  GameplayError,
  type GameplayCommandDefinition,
  type GameplayDefinition,
  type GameplaySetupContext,
} from "@mueo/cocofaith-sdk/gameplay";
import { BusinessError } from "./errors";
import type {
  BusinessCommand,
  BusinessResult,
  FaithBusinessModule,
} from "./types";

export function adaptGameplayDefinition(
  definition: GameplayDefinition<Record<string, unknown>, unknown>,
): FaithBusinessModule {
  let service: unknown;

  const setup = async (
    context: Parameters<NonNullable<FaithBusinessModule["init"]>>[0],
  ) => {
    service = definition.setup
      ? await definition.setup(
        context as unknown as GameplaySetupContext<Record<string, unknown>>,
      )
      : undefined;
  };

  return {
    name: definition.name,
    dependencies: definition.dependencies,
    defaultConfig: definition.config?.defaults ?? {},
    validateConfig: definition.config
      ? (value) => definition.config!.parse(value)
      : undefined,
    init: setup,
    reload: setup,
    commands: definition.commands.map((command) =>
      adaptCommand(definition.name, command, () => service),
    ),
  };
}

function adaptCommand(
  business: string,
  command: GameplayCommandDefinition<Record<string, unknown>, unknown>,
  service: () => unknown,
): BusinessCommand {
  return {
    id: command.id,
    commands: command.triggers,
    description: command.description,
    scenes: command.scenes,
    allowUnregistered: command.guest === true,
    async execute(context) {
      if (context.uid === null && command.guest !== true) {
        throw new BusinessError("UNREGISTERED");
      }

      try {
        return await executeGameplayCommand({
          business,
          command,
          uid: context.uid,
          event: context.event,
          args: context.args,
          path: context.path,
          core: context.core,
          config: context.config,
          service: service(),
        }) as BusinessResult;
      } catch (error) {
        throw normalizeGameplayError(error);
      }
    },
  };
}

function normalizeGameplayError(error: unknown): unknown {
  if (!(error instanceof GameplayError)) return error;
  return new BusinessError(error.code, error.message, error.details, {
    cause: error,
  });
}
