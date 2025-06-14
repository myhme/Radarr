import moment from 'moment';
import AppSectionState, {
  AppSectionFilterState,
} from 'App/State/AppSectionState';
import { CalendarView } from 'Calendar/calendarViews';
import { CalendarItem } from 'typings/Calendar';

interface CalendarOptions {
  showMovieInformation: boolean;
  showCinemaRelease: boolean;
  showDigitalRelease: boolean;
  showPhysicalRelease: boolean;
  showCutoffUnmetIcon: boolean;
  fullColorEvents: boolean;
}

interface CalendarAppState
  extends AppSectionState<CalendarItem>,
    AppSectionFilterState<CalendarItem> {
  searchMissingCommandId: number | null;
  start: moment.Moment;
  end: moment.Moment;
  dates: string[];
  time: string;
  view: CalendarView;
  options: CalendarOptions;
}

export default CalendarAppState;
