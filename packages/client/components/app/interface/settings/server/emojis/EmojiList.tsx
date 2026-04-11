import { createFormControl, createFormGroup } from "solid-forms";
import { For, Match, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";
import { css } from "styled-system/css";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useError } from "@revolt/i18n";
import { useModals } from "@revolt/modal";
import {
  Avatar,
  CategoryButton,
  CircularProgress,
  ColouredText,
  Column,
  Form2,
  Row,
  Text,
} from "@revolt/ui";

/**
 * Emoji list
 */
export function EmojiList(props: { server: Server }) {
  const err = useError();
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  // Validation requirements
  const namePattern = /^[a-z0-9_]{1,32}$/;
  const imgTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  const maxSize = 500 * 1024;

  // Validation errors
  const namePatternError = t`Lowercase, numbers and underscores only.`;
  const invalidTypeError = t`File type not supported, only ${imgTypes} are allowed.`;
  const imageSizeError = t`Image size can be maximum ${maxSize / 1024}KB`;

  function isDisabled() {
    return props.server.emojis.length >= CONFIGURATION.MAX_EMOJI;
  }

  const editGroup = createFormGroup(
    {
      name: createFormControl("", { required: true }),
      file: createFormControl<string | File[] | null>(null, {
        required: true,
      }),
    },
    {
      disabled: isDisabled(),
    },
  );

  const valError = (control: {
    errors: Record<string, unknown> | null | undefined;
    isDirty: boolean;
    isTouched: boolean;
  }) => {
    if (!control.isDirty && !control.isTouched) return undefined;
    if (!control.errors) return undefined;

    const errorKeys = Object.keys(control.errors);
    return errorKeys.length > 0
      ? (control.errors[errorKeys[0]] as string)
      : undefined;
  };

  async function onSubmit() {
    const body = new FormData();
    body.append("file", editGroup.controls.file.value![0]);

    const [key, value] = client().authenticationHeader;
    const data: { id: string } = await fetch(
      `${CONFIGURATION.DEFAULT_MEDIA_URL}/emojis`,
      {
        method: "POST",
        body,
        headers: {
          [key]: value,
        },
      },
    ).then((res) => res.json());

    await props.server.createEmoji(data.id, {
      name: editGroup.controls.name.value,
    });
  }

  function onReset() {
    editGroup.controls.name.setValue("");
    editGroup.controls.file.setValue(null);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column gap="lg">
      <form onSubmit={submit}>
        <Column>
          <Row align>
            <Column>
              <Form2.FileInput
                control={editGroup.controls.file}
                accept={imgTypes.join(",")}
                types={imgTypes}
                typeError={invalidTypeError}
                maxSize={maxSize}
                sizeError={imageSizeError}
                imageJustify={false}
                allowRemoval={false}
              />
            </Column>
            <Column grow>
              <Form2.TextField
                minlength={1}
                maxlength={32}
                counter
                name="name"
                control={editGroup.controls.name}
                label={t`Emoji Name`}
                pattern={namePattern}
                patternError={namePatternError}
              />

              <Row align>
                <Form2.Submit group={editGroup}>
                  <Trans>Create</Trans>
                </Form2.Submit>
                <Switch
                  fallback={
                    <Trans>
                      {CONFIGURATION.MAX_EMOJI - props.server.emojis.length}{" "}
                      emoji slots remaining
                    </Trans>
                  }
                >
                  <Match
                    when={
                      valError(editGroup.controls.name) ??
                      valError(editGroup.controls.file)
                    }
                  >
                    <ColouredText colour="var(--md-sys-color-error)">
                      {valError(editGroup.controls.name) ??
                        valError(editGroup.controls.file)}
                    </ColouredText>
                  </Match>

                  <Match when={editGroup.errors?.error}>
                    {err(editGroup.errors!.error)}
                  </Match>
                  <Match when={editGroup.isPending}>
                    <CircularProgress />
                  </Match>
                </Switch>
              </Row>
            </Column>
          </Row>
        </Column>
      </form>

      <Column gap="sm">
        <For
          each={props.server.emojis.toSorted((b, a) =>
            a.id.localeCompare(b.id),
          )}
        >
          {(emoji) => (
            <CategoryButton
              roundedIcon={false}
              icon={<Avatar src={emoji.url} shape="rounded-square" />}
              onClick={() => openModal({ type: "emoji_preview", emoji })}
            >
              <Column gap="none">
                <span class={css({ flex: 1 })}>:{emoji.name}:</span>
                <span
                  class={css({
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--gap-sm)",
                  })}
                >
                  <Avatar
                    size={12}
                    fallback={emoji.creator?.displayName}
                    src={emoji.creator?.animatedAvatarURL}
                  />
                  <Text class="label">{emoji.creator?.displayName}</Text>
                </span>
              </Column>
            </CategoryButton>
          )}
        </For>
      </Column>
    </Column>
  );
}
