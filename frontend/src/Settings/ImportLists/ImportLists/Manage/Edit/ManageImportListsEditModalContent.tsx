import React, { useCallback, useState } from 'react';
import FormGroup from 'Components/Form/FormGroup';
import FormInputGroup from 'Components/Form/FormInputGroup';
import FormLabel from 'Components/Form/FormLabel';
import Button from 'Components/Link/Button';
import ModalBody from 'Components/Modal/ModalBody';
import ModalContent from 'Components/Modal/ModalContent';
import ModalFooter from 'Components/Modal/ModalFooter';
import ModalHeader from 'Components/Modal/ModalHeader';
import { inputTypes } from 'Helpers/Props';
import { InputChanged } from 'typings/inputs';
import translate from 'Utilities/String/translate';
import styles from './ManageImportListsEditModalContent.css';

interface SavePayload {
  enabled?: boolean;
  enableAuto?: boolean;
  qualityProfileId?: number;
  minimumAvailability?: string;
  rootFolderPath?: string;
}

interface ManageImportListsEditModalContentProps {
  importListIds: number[];
  onSavePress(payload: object): void;
  onModalClose(): void;
}

const NO_CHANGE = 'noChange';

const enableOptions = [
  {
    key: NO_CHANGE,
    get value() {
      return translate('NoChange');
    },
    isDisabled: true,
  },
  {
    key: 'enabled',
    get value() {
      return translate('Enabled');
    },
  },
  {
    key: 'disabled',
    get value() {
      return translate('Disabled');
    },
  },
];

function ManageImportListsEditModalContent(
  props: ManageImportListsEditModalContentProps
) {
  const { importListIds, onSavePress, onModalClose } = props;

  const [enabled, setEnabled] = useState(NO_CHANGE);
  const [enableAuto, setEnableAuto] = useState(NO_CHANGE);
  const [qualityProfileId, setQualityProfileId] = useState<string | number>(
    NO_CHANGE
  );
  const [minimumAvailability, setMinimumAvailability] = useState(NO_CHANGE);
  const [rootFolderPath, setRootFolderPath] = useState(NO_CHANGE);

  const save = useCallback(() => {
    let hasChanges = false;
    const payload: SavePayload = {};

    if (enabled !== NO_CHANGE) {
      hasChanges = true;
      payload.enabled = enabled === 'enabled';
    }

    if (enableAuto !== NO_CHANGE) {
      hasChanges = true;
      payload.enableAuto = enableAuto === 'enabled';
    }

    if (qualityProfileId !== NO_CHANGE) {
      hasChanges = true;
      payload.qualityProfileId = qualityProfileId as number;
    }

    if (minimumAvailability !== NO_CHANGE) {
      hasChanges = true;
      payload.minimumAvailability = minimumAvailability as string;
    }

    if (rootFolderPath !== NO_CHANGE) {
      hasChanges = true;
      payload.rootFolderPath = rootFolderPath;
    }

    if (hasChanges) {
      onSavePress(payload);
    }

    onModalClose();
  }, [
    enabled,
    enableAuto,
    qualityProfileId,
    minimumAvailability,
    rootFolderPath,
    onSavePress,
    onModalClose,
  ]);

  const onInputChange = useCallback(({ name, value }: InputChanged) => {
    switch (name) {
      case 'enabled':
        setEnabled(value as string);
        break;
      case 'enableAuto':
        setEnableAuto(value as string);
        break;
      case 'qualityProfileId':
        setQualityProfileId(value as string);
        break;
      case 'minimumAvailability':
        setMinimumAvailability(value as string);
        break;
      case 'rootFolderPath':
        setRootFolderPath(value as string);
        break;
      default:
        console.warn(`EditImportListModalContent Unknown Input: '${name}'`);
    }
  }, []);

  const selectedCount = importListIds.length;

  return (
    <ModalContent onModalClose={onModalClose}>
      <ModalHeader>{translate('EditSelectedImportLists')}</ModalHeader>

      <ModalBody>
        <FormGroup>
          <FormLabel>{translate('Enabled')}</FormLabel>

          <FormInputGroup
            type={inputTypes.SELECT}
            name="enabled"
            value={enabled}
            values={enableOptions}
            onChange={onInputChange}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>{translate('AutomaticAdd')}</FormLabel>

          <FormInputGroup
            type={inputTypes.SELECT}
            name="enableAuto"
            value={enableAuto}
            values={enableOptions}
            onChange={onInputChange}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>{translate('QualityProfile')}</FormLabel>

          <FormInputGroup
            type={inputTypes.QUALITY_PROFILE_SELECT}
            name="qualityProfileId"
            value={qualityProfileId}
            includeNoChange={true}
            includeNoChangeDisabled={false}
            onChange={onInputChange}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>{translate('MinimumAvailability')}</FormLabel>

          <FormInputGroup
            type={inputTypes.AVAILABILITY_SELECT}
            name="minimumAvailability"
            value={minimumAvailability}
            includeNoChange={true}
            includeNoChangeDisabled={false}
            onChange={onInputChange}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>{translate('RootFolder')}</FormLabel>

          <FormInputGroup
            type={inputTypes.ROOT_FOLDER_SELECT}
            name="rootFolderPath"
            value={rootFolderPath}
            includeNoChange={true}
            includeNoChangeDisabled={false}
            selectedValueOptions={{ includeFreeSpace: false }}
            onChange={onInputChange}
          />
        </FormGroup>
      </ModalBody>

      <ModalFooter className={styles.modalFooter}>
        <div className={styles.selected}>
          {translate('CountImportListsSelected', {
            count: selectedCount,
          })}
        </div>

        <div>
          <Button onPress={onModalClose}>{translate('Cancel')}</Button>

          <Button onPress={save}>{translate('ApplyChanges')}</Button>
        </div>
      </ModalFooter>
    </ModalContent>
  );
}

export default ManageImportListsEditModalContent;
