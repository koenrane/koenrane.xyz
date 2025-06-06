// skipcq: JS-W1028, JS-W1028
import type { JSX } from "preact"

import React from "react"

import { type GlobalConfiguration } from "../cfg"
import { type ValidLocale } from "../i18n"
import { type QuartzPluginData } from "../plugins/vfile"

export type ValidDateType = keyof Required<QuartzPluginData>["dates"]

export function getDate(cfg: GlobalConfiguration, data: QuartzPluginData): Date | undefined {
  if (!cfg.defaultDateType) {
    throw new Error(
      "Field 'defaultDateType' was not set in the configuration object of quartz.config.ts. See https://quartz.jzhao.xyz/configuration#general-configuration for more details.",
    )
  }
  return data.dates?.[cfg.defaultDateType]
}

/**
 * Returns the ordinal suffix.
 * For example, 1 -> "st", 2 -> "nd", 3 -> "rd", 4 -> "th", etc.
 * Handles special cases like 11th, 12th, and 13th.
 * @param number
 * @returns The ordinal suffix as a string.
 */
export function getOrdinalSuffix(number: number): string {
  if (number > 31 || number < 0) {
    throw new Error("Number must be between 0 and 31")
  }

  if (number >= 11 && number <= 13) {
    return "th"
  }
  switch (number % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

/**
 * Formats a Date object into a localized string with an ordinal suffix for the day and includes the year.
 * @param d - The Date object to format.
 * @param locale - The locale string (default is "en-US").
 * @param monthFormat - The format of the month ("long" or "short").
 * @param includeOrdinalSuffix - Whether to include the ordinal suffix.
 * @param formatOrdinalSuffix - Whether to format the ordinal suffix as a superscript. If true, then you need to set the innerHTML of the time element to the date string.
 * @returns The formatted date string, e.g., "August 1st, 2023".
 */
export function formatDate(
  d: Date,
  locale: ValidLocale = "en-US",
  monthFormat: "long" | "short" = "short",
  includeOrdinalSuffix = true,
  formatOrdinalSuffix = true,
  extraOrdinalStyling?: string,
): string {
  let day: string | number = d.getDate()
  const month = d.toLocaleDateString(locale, { month: monthFormat })
  const year = d.getFullYear()
  let suffix = ""
  if (includeOrdinalSuffix) {
    suffix = getOrdinalSuffix(day)
    if (formatOrdinalSuffix) {
      suffix = `<span class="ordinal-suffix"${extraOrdinalStyling ? ` style="${extraOrdinalStyling}"` : ""}>${suffix}</span>`
      day = `<span class="ordinal-num">${day}</span>`
    }
  }
  return `${month} ${day}${suffix}, ${year}`
}

/**
 * Formats a Date object into ISO date format (YYYY-MM-DD).
 * @param d - The Date object to format.
 * @returns The formatted date string, e.g., "2023-07-20".
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a date range into ISO format.
 * @param startDate - The start Date object.
 * @param endDate - The end Date object.
 * @returns The formatted date range string, e.g., "2023-06-07 - 2025-06-06".
 */
export function formatDateRangeISO(startDate: Date, endDate: Date): string {
  const formattedStart = formatDateISO(startDate)
  const formattedEnd = formatDateISO(endDate)
  return `${formattedStart} - ${formattedEnd}`
}

//-------------------------------------------------------------------------------------------------//
// DateRangeElement: functionality for date ranges for "start: <date> - end: <date>"
/**
 * Formats a date range into a localized string with ordinal suffixes.
 * @param startDate - The start Date object.
 * @param endDate - The end Date object.
 * @param locale - The locale string (default is "en-US").
 * @param monthFormat - The format of the month ("long" or "short").
 * @param includeOrdinalSuffix - Whether to include the ordinal suffix.
 * @param formatOrdinalSuffix - Whether to format the ordinal suffix as a superscript.
 * @returns The formatted date range string, e.g., "June 7th, 2023 - June 6th, 2025".
 */
export function formatDateRange(
  startDate: Date,
  endDate: Date,
  locale: ValidLocale = "en-US",
  monthFormat: "long" | "short" = "short",
  includeOrdinalSuffix = true,
  formatOrdinalSuffix = true,
  extraOrdinalStyling?: string,
): string {
  const formattedStart = formatDate(
    startDate,
    locale,
    monthFormat,
    includeOrdinalSuffix,
    formatOrdinalSuffix,
    extraOrdinalStyling,
  )
  const formattedEnd = formatDate(
    endDate,
    locale,
    monthFormat,
    includeOrdinalSuffix,
    formatOrdinalSuffix,
    extraOrdinalStyling,
  )
  return `${formattedStart} - ${formattedEnd}`
}
//-------------------------------------------------------------------------------------------------//


interface DateElementProps {
  monthFormat?: "long" | "short"
  includeOrdinalSuffix?: boolean
  cfg: GlobalConfiguration
  date: Date | string
  formatOrdinalSuffix?: boolean
}

//-------------------------------------------------------------------------------------------------//
// DateRangeElement: functionality for date ranges for "start: <date> - end: <date>"
interface DateRangeElementProps {
  monthFormat?: "long" | "short" | "iso"
  includeOrdinalSuffix?: boolean
  cfg: GlobalConfiguration
  date: Date | string | { start: string | Date; end: string | Date }
  formatOrdinalSuffix?: boolean
}

// New component that can handle both single dates and date ranges
export const DateRangeElement = ({
  cfg,
  date,
  monthFormat,
  includeOrdinalSuffix,
  formatOrdinalSuffix,
}: DateRangeElementProps): JSX.Element => {
  // Check if it's a date range object
  if (typeof date === 'object' && date !== null && !(date instanceof Date) && 'start' in date && 'end' in date) {
    const startDate = date.start instanceof Date ? date.start : new Date(date.start)
    const endDate = date.end instanceof Date ? date.end : new Date(date.end)

    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
      throw new Error(`date range must contain valid Date objects or date strings: ${JSON.stringify(date)}`)
    }

    const formattedRange = monthFormat === "iso" 
      ? formatDateRangeISO(startDate, endDate)
      : formatDateRange(
          startDate,
          endDate,
          cfg.locale,
          monthFormat,
          includeOrdinalSuffix,
          formatOrdinalSuffix,
          "",
        )

    return (
      <time
        dateTime={`${startDate.toISOString()}/${endDate.toISOString()}`}
        dangerouslySetInnerHTML={{
          __html: formattedRange,
        }}
      />
    )
  } else {
    // Handle single date (existing functionality)
    const dateObj = date instanceof Date ? date : new Date(date as string)

    if (!dateObj || isNaN(dateObj.getTime())) {
      throw new Error(`date must be a valid Date object or date string: ${date}`)
    }

    const formattedDate = monthFormat === "iso"
      ? formatDateISO(dateObj)
      : formatDate(
          dateObj,
          cfg.locale,
          monthFormat,
          includeOrdinalSuffix,
          formatOrdinalSuffix,
          "",
        )

    return (
      <time
        dateTime={dateObj.toISOString()}
        dangerouslySetInnerHTML={{
          __html: formattedDate,
        }}
      />
    )
  }
}
//-------------------------------------------------------------------------------------------------//


// Render date element with proper datetime attribute
export const DateElement = ({
  cfg,
  date,
  monthFormat,
  includeOrdinalSuffix,
  formatOrdinalSuffix,
}: DateElementProps): JSX.Element => {
  // Convert string dates to Date objects
  const dateObj = date instanceof Date ? date : new Date(date)

  if (!dateObj || isNaN(dateObj.getTime())) {
    throw new Error(`date must be a valid Date object or date string: ${date}`)
  }

  return dateObj ? (
    <time
      dateTime={dateObj.toISOString()}
      dangerouslySetInnerHTML={{
        __html: formatDate(
          dateObj,
          cfg.locale,
          monthFormat,
          includeOrdinalSuffix,
          formatOrdinalSuffix,
          "",
        ),
      }}
    />
  ) : (
    <></>
  )
}
