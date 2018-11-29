import * as React from 'react';
import {keys} from '../../models';
import {StorageUtils} from '../../utils/index';
import CustomCheckbox from '../CustomCheckbox/CustomCheckbox';
import ModalHeader from './ModalHeader/ModalHeader';
import {
  ApplyButton,
  CancelButton,
  Modal,
  ModalContent,
  ModalReminder
} from './styles';
import withModal from './withModal';

interface ConfirmModalProps {
  onApply: () => any;
  onClose: () => void;
  message: string;
}

const confirmStorage = StorageUtils(keys.confirmReminder);

// tslint:disable-next-line:no-var-requires
const {Flex} = require('grid-styled');

interface ConfirmModalState {
  isReminderChecked: boolean;
  submitting: boolean;
}

class ConfirmModal extends React.Component<
  ConfirmModalProps,
  ConfirmModalState
> {
  constructor(props: ConfirmModalProps) {
    super(props);
    this.state = {
      isReminderChecked: !JSON.parse(confirmStorage.get() || 'true'),
      submitting: false
    };
  }

  handleChange = () => (e: any) => {
    this.setState({
      isReminderChecked: e.target.checked
    });
  };

  handleApply = async () => {
    confirmStorage.set(!this.state.isReminderChecked);
    this.setState({
      submitting: true
    });
    try {
      await this.props.onApply();
    } finally {
      this.setState({
        submitting: false
      });
    }
  };

  handleCancel = () => {
    this.props.onClose();
  };

  render() {
    return (
      <React.Fragment>
        <Modal>
          <ModalHeader title={'Confirm'} onClick={this.handleCancel} />
          <ModalContent>
            Do you really want to {this.props.message}?
          </ModalContent>
          <ModalReminder>
            <CustomCheckbox
              change={this.handleChange()}
              label={`Don't ask me again`}
              checked={this.state.isReminderChecked}
            />
          </ModalReminder>
          <Flex justify={'space-between'} style={{marginTop: '24px'}}>
            <ApplyButton
              type="button"
              onClick={this.handleApply}
              disabled={this.state.submitting}
            >
              Yes
            </ApplyButton>
            <CancelButton type="button" onClick={this.handleCancel}>
              Cancel
            </CancelButton>
          </Flex>
        </Modal>
      </React.Fragment>
    );
  }
}

export default withModal<ConfirmModalProps>(ConfirmModal);
