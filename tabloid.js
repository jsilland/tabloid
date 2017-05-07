function tabloid(chromeTabs, onSelect) {
  const parser = document.createElement('a');
  const tabSuggestions = chromeTabs.map(function(tab) {
      parser.href = tab.url;
      tab.parsedUrl = {
        hostname: parser.hostname,
        pathname: parser.pathname
      }
      return {
        value: tab.title,
        data: tab
      };
    }).sort(function(a, b) {
      return a.value.localeCompare(b.value);
    });

  const suggestionsHtml = tabSuggestions.map(function(tabSuggestion, index) {
    return '<div class="autocomplete-suggestion" data-index="' + index + '">' + formatResult(tabSuggestion, null, index) + '</div>';
  }).join('');

  const searchField = $('#search');

  searchField.autocomplete({
    lookup: tabSuggestions,
    maxHeight: 500,
    preserveInput: true,
    onSelect: onSelect,
    formatResult: formatResult,
    lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
      const tokens = queryLowerCase.split(/\s/);
      return [
        suggestion.value.toLowerCase(),
        suggestion.data.parsedUrl.hostname.toLowerCase(),
        suggestion.data.parsedUrl.pathname.toLowerCase()
      ].some(function(searchable) {
        return tokens.every(function(token) {
          return searchable.indexOf(token) !== -1;
        });
      });
    },
    appendTo: '#container',
    onSearchComplete: function(query, suggestions) {
      $('html').height($('#container').height());
    }
  });

  function formatResult(suggestion, value, index) {
    var favIconUrl = suggestion.data.favIconUrl;
    if (favIconUrl === undefined || suggestion.data.favIconUrl.indexOf('chrome://theme') === 0) {
      favIconUrl = 'document.png';
    }
    return '<div class="autocomplete-value"><img src="' + favIconUrl +'" /><span>' + suggestion.value + '</span></div>';
  }

  function keyUp(event) {
    const autocomplete = searchField.autocomplete();
    if(event.target.value === '') {
      showAllSuggestions();
      switch (event.which) {
        case 38:
          autocomplete.moveUp();
          break;
        case 40:
          autocomplete.moveDown();
          break;
        case 13:
          if (autocomplete.selectedIndex === -1) {
              autocomplete.hide();
              return;
          }
          autocomplete.select(autocomplete.selectedIndex);
          break;
        default:
          return
      }
    }
  }

  function showAllSuggestions() {
    const autocomplete = searchField.autocomplete();
    const suggestionsContainer = $(autocomplete.suggestionsContainer);
    if (suggestionsContainer.is(":visible")) {
      return;
    }

    suggestionsContainer.html(suggestionsHtml);
    autocomplete.fixPosition();
    autocomplete.suggestions = tabSuggestions;
    suggestionsContainer.show();
    $('html').height($('#container').height());
  }

  searchField.keyup((event), keyUp);
  searchField.focus();
  showAllSuggestions();
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.query({}, function(tabs) {
    tabloid(tabs, function(suggestion) {
      chrome.tabs.update(suggestion.data.id, {active: true}, function(tab) {
        chrome.windows.update(tab.windowId, {focused: true}, function(win) {
          window.close();
        });
      });
    });
  });
});
