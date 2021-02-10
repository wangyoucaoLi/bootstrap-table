/* eslint-disable no-use-before-define */
const Utils = $.fn.bootstrapTable.utils
const searchControls = 'select, input:not([type="checkbox"]):not([type="radio"])'

export function getOptionsFromSelectControl (selectControl) {
  return selectControl.get(selectControl.length - 1).options
}

export function getControlContainer (that) {
  if (that.options.filterControlContainer) {
    return $(`${that.options.filterControlContainer}`)
  }

  if (that.options.height && that.options.initialized) {
    return $('.fixed-table-header table thead')
  }

  return that.$header
}

export function isKeyAllowed (keyCode) {
  return $.inArray(keyCode, [37, 38, 39, 40]) > -1
}

export function getSearchControls (that) {
  return getControlContainer(that).find(searchControls)
}

export function hideUnusedSelectOptions (selectControl, uniqueValues) {
  const options = getOptionsFromSelectControl(selectControl)

  for (let i = 0; i < options.length; i++) {
    if (options[i].value !== '') {
      if (!uniqueValues.hasOwnProperty(options[i].value)) {
        selectControl.find(Utils.sprintf('option[value=\'%s\']', options[i].value)).hide()
      } else {
        selectControl.find(Utils.sprintf('option[value=\'%s\']', options[i].value)).show()
      }
    }
  }
}

export function existOptionInSelectControl (selectControl, value) {
  const options = getOptionsFromSelectControl(selectControl)

  for (let i = 0; i < options.length; i++) {
    if (options[i].value === Utils.unescapeHTML(value.toString())) {
      // The value is not valid to add
      return true
    }
  }

  // If we get here, the value is valid to add
  return false
}

export function addOptionToSelectControl (selectControl, _value, text, selected) {
  const value = (_value === undefined || _value === null) ? '' : _value.toString().trim()
  const $selectControl = $(selectControl.get(selectControl.length - 1))

  if (!existOptionInSelectControl(selectControl, value)) {
    const option = $(`<option value="${value}">${text}</option>`)

    if (value === selected) {
      option.attr('selected', true)
    }

    $selectControl.append(option)
  }
}

export function sortSelectControl (selectControl, orderBy) {
  const $selectControl = $(selectControl.get(selectControl.length - 1))
  const $opts = $selectControl.find('option:gt(0)')

  if (orderBy !== 'server') {
    $opts.sort((a, b) => {
      return Utils.sort(a.textContent, b.textContent, orderBy === 'desc' ? -1 : 1)
    })
  }

  $selectControl.find('option:gt(0)').remove()
  $selectControl.append($opts)
}

export function fixHeaderCSS ({ $tableHeader }, pixels = '89px') {
  $tableHeader.css('height', pixels)
}

export function getElementClass ($element) {
  return $element.attr('class').replace('form-control', '').replace('focus-temp', '').replace('search-input', '').trim()
}

export function getCursorPosition (el) {
  if ($(el).is('input[type=search]')) {
    let pos = 0

    if ('selectionStart' in el) {
      pos = el.selectionStart
    } else if ('selection' in document) {
      el.focus()
      const Sel = document.selection.createRange()
      const SelLength = document.selection.createRange().text.length

      Sel.moveStart('character', -el.value.length)
      pos = Sel.text.length - SelLength
    }
    return pos
  }
  return -1
}

export function cacheCaretAndFocus (that) {
  const searchControls = getSearchControls(that)

  that.options.valuesFilterControl = []

  searchControls.each(function () {
    let $field = $(this)

    if (that.options.height) {
      const fieldClass = getElementClass($field)

      $field = $(`.fixed-table-header .${fieldClass}`)
    }

    that.options.valuesFilterControl.push({
      field: $field.closest('[data-field]').data('field'),
      position: getCursorPosition($field.get(0)),
      hasFocus: $field.is(':focus')
    })
  })
}

export function setCaretPosition (elem, caretPos) {
  try {
    if (elem) {
      if (elem.createTextRange) {
        const range = elem.createTextRange()

        range.move('character', caretPos)
        range.select()
      } else {
        elem.setSelectionRange(caretPos, caretPos)
      }
    }
  }
  catch (ex) {
    // ignored
  }
}

export function setValues (that) {
  let field = null
  let result = []
  const searchControls = getSearchControls(that)

  if (that.options.valuesFilterControl.length > 0) {
    //  Callback to apply after settings fields values
    let fieldToFocusCallback = null

    searchControls.each((i, el) => {
      const $this = $(el)

      field = $this.closest('[data-field]').data('field')
      result = that.options.valuesFilterControl.filter(valueObj => valueObj.field === field)

      if (result.length > 0) {

        if (result[0].hasFocus) {
          // set callback if the field had the focus.
          fieldToFocusCallback = ((fieldToFocus, carretPosition) => {
            // Closure here to capture the field and cursor position
            const closedCallback = () => {
              fieldToFocus.focus()
              setCaretPosition(fieldToFocus, carretPosition)
            }

            return closedCallback
          })($this.get(0), result[0].position)
        }
      }
    })

    // Callback call.
    if (fieldToFocusCallback !== null) {
      fieldToFocusCallback()
    }
  }
}

export function collectBootstrapCookies () {
  const cookies = []
  const foundCookies = document.cookie.match(/(?:bs.table.)(\w*)/g)
  const foundLocalStorage = localStorage

  if (foundCookies) {
    $.each(foundCookies, (i, _cookie) => {
      let cookie = _cookie

      if (/./.test(cookie)) {
        cookie = cookie.split('.').pop()
      }

      if ($.inArray(cookie, cookies) === -1) {
        cookies.push(cookie)
      }
    })
  }
  if (foundLocalStorage) {
    for (let i = 0; i < foundLocalStorage.length; i++) {
      let cookie = foundLocalStorage.key(i)

      if (/./.test(cookie)) {
        cookie = cookie.split('.').pop()
      }

      if (!cookies.includes(cookie)) {
        cookies.push(cookie)
      }
    }
  }
  return cookies
}

export function escapeID (id) {
  // eslint-disable-next-line no-useless-escape
  return String(id).replace(/([:.\[\],])/g, '\\$1')
}

export function isColumnSearchableViaSelect ({ filterControl, searchable }) {
  return filterControl && filterControl.toLowerCase() === 'select' && searchable
}

export function isFilterDataNotGiven ({ filterData }) {
  return filterData === undefined ||
        filterData.toLowerCase() === 'column'
}

export function hasSelectControlElement (selectControl) {
  return selectControl && selectControl.length > 0
}

export function initFilterSelectControls (that) {
  const data = that.data
  const z = that.options.pagination ?
    that.options.sidePagination === 'server' ?
      that.pageTo :
      that.options.totalRows :
    that.pageTo

  $.each(that.header.fields, (j, field) => {
    const column = that.columns[that.fieldsColumnsIndex[field]]
    const selectControl = getControlContainer(that).find(`select.bootstrap-table-filter-control-${escapeID(column.field)}`)

    if (isColumnSearchableViaSelect(column) && isFilterDataNotGiven(column) && hasSelectControlElement(selectControl)) {
      if (selectControl.get(selectControl.length - 1).options.length === 0) {
        // Added the default option
        addOptionToSelectControl(selectControl, '', column.filterControlPlaceholder, column.filterDefault)
      }

      const uniqueValues = {}

      for (let i = 0; i < z; i++) {
        // Added a new value
        let fieldValue = Utils.getItemField(data[i], field, false)
        const formatter = that.options.editable && column.editable ? column._formatter : that.header.formatters[j]
        let formattedValue = Utils.calculateObjectValue(that.header, formatter, [fieldValue, data[i], i], fieldValue)

        if (column.filterDataCollector) {
          formattedValue = Utils.calculateObjectValue(that.header, column.filterDataCollector, [fieldValue, data[i], formattedValue], formattedValue)
        }

        if (column.searchFormatter) {
          fieldValue = formattedValue
        }
        uniqueValues[formattedValue] = fieldValue

        if (typeof formattedValue === 'object' && formattedValue !== null) {
          formattedValue.forEach(value => {
            addOptionToSelectControl(selectControl, value, value, column.filterDefault)
          })
          continue
        }

        // eslint-disable-next-line guard-for-in
        for (const key in uniqueValues) {
          addOptionToSelectControl(selectControl, uniqueValues[key], key, column.filterDefault)
        }
      }

      sortSelectControl(selectControl, column.filterOrderBy)
      if (that.options.hideUnusedSelectOptions) {
        hideUnusedSelectOptions(selectControl, uniqueValues)
      }
    }
  })
}

export function getFilterDataMethod (objFilterDataMethod, searchTerm) {
  const keys = Object.keys(objFilterDataMethod)

  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === searchTerm) {
      return objFilterDataMethod[searchTerm]
    }
  }
  return null
}

export function createControls (that, header) {
  let addedFilterControl = false
  let html

  $.each(that.columns, (_, column) => {
    html = []

    if (!column.visible) {
      return
    }

    if (!column.filterControl && !that.options.filterControlContainer) {
      html.push('<div class="no-filter-control"></div>')
    } else if (that.options.filterControlContainer) {
      // Use a filter control container instead of th
      const $filterControls = $(`.bootstrap-table-filter-control-${column.field}`)

      $.each($filterControls, (_, filterControl) => {
        const $filterControl = $(filterControl)

        if (!$filterControl.is('[type=radio]')) {
          const placeholder = column.filterControlPlaceholder || ''

          $filterControl.attr('placeholder', placeholder).val(column.filterDefault)
        }

        $filterControl.attr('data-field', column.field)
      })

      addedFilterControl = true
    } else {
      // Create the control based on the html defined in the filterTemplate array.
      const nameControl = column.filterControl.toLowerCase()

      html.push('<div class="filter-control">')
      addedFilterControl = true

      if (column.searchable && that.options.filterTemplate[nameControl]) {
        html.push(
          that.options.filterTemplate[nameControl](
            that,
            column.field,
            column.filterControlPlaceholder ?
              column.filterControlPlaceholder :
              '',
            column.filterDefault
          )
        )
      }
    }

    // Filtering by default when it is set.
    if (!column.filterControl && '' !== column.filterDefault && 'undefined' !== typeof column.filterDefault) {
      if ($.isEmptyObject(that.filterColumnsPartial)) {
        that.filterColumnsPartial = {}
      }

      that.filterColumnsPartial[column.field] = column.filterDefault
    }

    $.each(header.find('th'), (_, th) => {
      const $th = $(th)

      if ($th.data('field') === column.field) {
        $th.find('.fht-cell').append(html.join(''))
        return false
      }
    })

    if (column.filterData && column.filterData.toLowerCase() !== 'column') {
      const filterDataType = getFilterDataMethod(filterDataMethods, column.filterData.substring(0, column.filterData.indexOf(':')))
      let filterDataSource
      let selectControl

      if (filterDataType) {
        filterDataSource = column.filterData.substring(column.filterData.indexOf(':') + 1, column.filterData.length)
        selectControl = header.find(`.bootstrap-table-filter-control-${escapeID(column.field)}`)

        addOptionToSelectControl(selectControl, '', column.filterControlPlaceholder, column.filterDefault)
        filterDataType(filterDataSource, selectControl, that.options.filterOrderBy, column.filterDefault)
      } else {
        throw new SyntaxError(
          'Error. You should use any of these allowed filter data methods: var, obj, json, url, func.' +
                    ' Use like this: var: {key: "value"}'
        )
      }
    }
  })

  if (addedFilterControl) {
    header.off('keyup', 'input').on('keyup', 'input', ({ currentTarget, keyCode }, obj) => {
      keyCode = obj ? obj.keyCode : keyCode

      if (that.options.searchOnEnterKey && keyCode !== 13) {
        return
      }

      if (isKeyAllowed(keyCode)) {
        return
      }

      const $currentTarget = $(currentTarget)

      if ($currentTarget.is(':checkbox') || $currentTarget.is(':radio')) {
        return
      }

      clearTimeout(currentTarget.timeoutId || 0)
      currentTarget.timeoutId = setTimeout(() => {
        that.onColumnSearch({ currentTarget, keyCode })
      }, that.options.searchTimeOut)
    })

    header.off('change', 'select:not(".ms-offscreen")').on('change', 'select:not(".ms-offscreen")', ({ currentTarget, keyCode }) => {
      const $selectControl = $(currentTarget)
      const value = $selectControl.val()

      if (value && value.length > 0 && value.trim()) {
        $selectControl.find('option[selected]').removeAttr('selected')
        $selectControl.find(`option[value="${ value }"]`).attr('selected', true)
      } else {
        $selectControl.find('option[selected]').removeAttr('selected')
      }

      clearTimeout(currentTarget.timeoutId || 0)
      currentTarget.timeoutId = setTimeout(() => {
        that.onColumnSearch({ currentTarget, keyCode })
      }, that.options.searchTimeOut)
    })

    header.off('mouseup', 'input:not([type=radio])').on('mouseup', 'input:not([type=radio])', ({ currentTarget, keyCode }) => {
      const $input = $(currentTarget)
      const oldValue = $input.val()

      if (oldValue === '') {
        return
      }

      setTimeout(() => {
        const newValue = $input.val()

        if (newValue === '') {
          clearTimeout(currentTarget.timeoutId || 0)
          currentTarget.timeoutId = setTimeout(() => {
            that.onColumnSearch({ currentTarget, keyCode })
          }, that.options.searchTimeOut)
        }
      }, 1)
    })

    header.off('change', 'input[type=radio]').on('change', 'input[type=radio]', ({ currentTarget, keyCode }) => {
      clearTimeout(currentTarget.timeoutId || 0)
      currentTarget.timeoutId = setTimeout(() => {
        that.onColumnSearch({ currentTarget, keyCode })
      }, that.options.searchTimeOut)
    })

    // Consider support default date picker
    if (header.find('.date-filter-control').length > 0) {
      $.each(that.columns, (i, { filterDefault, filterControl, field, filterDatepickerOptions }) => {
        if (filterControl !== undefined && filterControl.toLowerCase() === 'datepicker') {
          const $datepicker = header.find(`.date-filter-control.bootstrap-table-filter-control-${field}`)

          $datepicker.datepicker(filterDatepickerOptions)

          if (filterDefault) {
            $datepicker.datepicker('setDate', filterDefault)
          }

          $datepicker.on('changeDate', ({ currentTarget, keyCode }) => {
            clearTimeout(currentTarget.timeoutId || 0)
            currentTarget.timeoutId = setTimeout(() => {
              that.onColumnSearch({ currentTarget, keyCode })
            }, that.options.searchTimeOut)
          })
        }
      })
    }

    if (that.options.sidePagination !== 'server' && !that.options.height) {
      that.triggerSearch()
    }

    if (!that.options.filterControlVisible) {
      header.find('.filter-control, .no-filter-control').hide()
    }
  } else {
    header.find('.filter-control, .no-filter-control').hide()
  }

  that.trigger('created-controls')
}

export function getDirectionOfSelectOptions (_alignment) {
  const alignment = _alignment === undefined ? 'left' : _alignment.toLowerCase()

  switch (alignment) {
    case 'left':
      return 'ltr'
    case 'right':
      return 'rtl'
    case 'auto':
      return 'auto'
    default:
      return 'ltr'
  }
}

export function syncHeaders (that) {
  if (!that.options.height) {
    return
  }
  const fixedHeader = $('.fixed-table-header table thead')

  if (fixedHeader.length === 0) {
    return
  }

  that.$header.children().find('th[data-field]').each((_, element) => {
    if (element.classList[0] !== 'bs-checkbox') {
      const $element = $(element)
      const $field = $element.data('field')
      const $fixedField = $(`th[data-field='${$field}']`).not($element)

      const input = $element.find('input')
      const fixedInput = $fixedField.find('input')

      if (input.length > 0 && fixedInput.length > 0) {
        if (input.val() !== fixedInput.val()) {
          input.val(fixedInput.val())
        }
      }
    }
  })
}

const filterDataMethods = {
  func (filterDataSource, selectControl, filterOrderBy, selected) {
    const variableValues = window[filterDataSource].apply()

    // eslint-disable-next-line guard-for-in
    for (const key in variableValues) {
      addOptionToSelectControl(selectControl, key, variableValues[key], selected)
    }
    sortSelectControl(selectControl, filterOrderBy)
  },
  obj (filterDataSource, selectControl, filterOrderBy, selected) {
    const objectKeys = filterDataSource.split('.')
    const variableName = objectKeys.shift()
    let variableValues = window[variableName]

    if (objectKeys.length > 0) {
      objectKeys.forEach(key => {
        variableValues = variableValues[key]
      })
    }

    // eslint-disable-next-line guard-for-in
    for (const key in variableValues) {
      addOptionToSelectControl(selectControl, key, variableValues[key], selected)
    }
    sortSelectControl(selectControl, filterOrderBy)
  },
  var (filterDataSource, selectControl, filterOrderBy, selected) {
    const variableValues = window[filterDataSource]
    const isArray = Array.isArray(variableValues)

    for (const key in variableValues) {
      if (isArray) {
        addOptionToSelectControl(selectControl, variableValues[key], variableValues[key], selected)
      } else {
        addOptionToSelectControl(selectControl, key, variableValues[key], selected)
      }
    }
    sortSelectControl(selectControl, filterOrderBy)
  },
  url (filterDataSource, selectControl, filterOrderBy, selected) {
    $.ajax({
      url: filterDataSource,
      dataType: 'json',
      success (data) {
        // eslint-disable-next-line guard-for-in
        for (const key in data) {
          addOptionToSelectControl(selectControl, key, data[key], selected)
        }
        sortSelectControl(selectControl, filterOrderBy)
      }
    })
  },
  json (filterDataSource, selectControl, filterOrderBy, selected) {
    const variableValues = JSON.parse(filterDataSource)

    // eslint-disable-next-line guard-for-in
    for (const key in variableValues) {
      addOptionToSelectControl(selectControl, key, variableValues[key], selected)
    }
    sortSelectControl(selectControl, filterOrderBy)
  }
}