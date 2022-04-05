import React from 'react';
import classnames from 'classnames';
import connectField from 'uniforms/connectField';
import filterDOMProps from 'uniforms/filterDOMProps';
import DatePicker from 'react-datepicker';
import isValid from 'date-fns/isValid';

const dateParse = (onChange, date) => {
  if (date && isValid(date)) {
    return onChange(date.getTime());
  }
  return onChange(null);
};

const DatePickerField = ({
  className,
  disabled,
  error,
  errorMessage,
  icon,
  iconLeft,
  iconProps,
  id,
  inputRef,
  label,
  max,
  min,
  name,
  onChange,
  placeholder,
  required,
  showInlineError,
  value,
  component,
  ...props
}) => (
  <div
    className={classnames(className, { disabled, error, required }, 'field')}
    {...filterDOMProps(props)}
  >
    {label && <label htmlFor={id}>{label}</label>}
    <div className={classnames('ui', { left: iconLeft, icon: icon || iconLeft }, 'input')}>
      <DatePicker
        disabled={disabled}
        id={id}
        name={name}
        onChange={(...dateObject) => dateParse(onChange, ...dateObject)}
        dateFormat="dd.MM.yyyy"
        peekNextMonth
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        placeholder={placeholder}
        ref={inputRef}
        selected={value ? new Date(value) : null}
      />
      {(icon || iconLeft) && <i className={`${icon || iconLeft} icon`} {...iconProps} />}
    </div>

    {!!(error && showInlineError) && <div className="ui red basic pointing label">{errorMessage}</div>}
  </div>
);

DatePickerField.displayName = 'DatePickerField';

export default connectField(DatePickerField);
