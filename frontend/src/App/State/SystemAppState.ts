import DiskSpace from 'typings/DiskSpace';
import Health from 'typings/Health';
import LogFile from 'typings/LogFile';
import SystemStatus from 'typings/SystemStatus';
import Task from 'typings/Task';
import Update from 'typings/Update';
import AppSectionState, { AppSectionItemState } from './AppSectionState';

export type DiskSpaceAppState = AppSectionState<DiskSpace>;
export type HealthAppState = AppSectionState<Health>;
export type SystemStatusAppState = AppSectionItemState<SystemStatus>;
export type TaskAppState = AppSectionState<Task>;
export type LogFilesAppState = AppSectionState<LogFile>;
export type UpdateAppState = AppSectionState<Update>;

interface SystemAppState {
  diskSpace: DiskSpaceAppState;
  health: HealthAppState;
  logFiles: LogFilesAppState;
  status: SystemStatusAppState;
  tasks: TaskAppState;
  updateLogFiles: LogFilesAppState;
  updates: UpdateAppState;
}

export default SystemAppState;
