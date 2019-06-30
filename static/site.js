// search.rvahealth.org functions
var list, source, template, serviceType, alink, search, tt;

function init() {
  
  // get the list information via tabletop
  getList.tabletop();

  // // create Autolinker instance for use in filtering
  // // plain text URLs and Emails in the Handlebars helper
  // alink = new Autolinker( {
  //   className: "myLink"
  // } );

  // use this if using get.py
  // getList.local();
}

var getList = {
  tabletop: function() {
    Tabletop.init({
      key: '1zcf8HFaI2WesW-NkawO0g6pSrg4B8R5uH1l8oMI0K-I', // copy of live spreadsheet
      callback: success
    });
  },
  local: function() {
    $.ajax({
      url: '../list.json',
      dataType: 'json',
      success: success,
      error: function(err) {
        console.error(err);
      }
    });
  }
}

/* 
callback function after the list data has
been returned successfully. Add it to `list`
so we have access to the information globally */
function success(data, tabletop) {

  // console.log(data, tabletop);

  tt = tabletop;

  // remove loader
  document.getElementById('loader').className = 'loaded';

  // assign data to list for global access
  list = data;

  // begin looping through the list data
  listLoop();
}

function initSearch() {
  
  // set up search fields, based on classes in the static/templates/service.handlebars template
  var options = {
    valueNames: [ 'title' ],
    page: 1000
  }

  // generate the searchable list object, send to search for global access
  search = new List('service-list-wrapper', options);
}

function initAutocomplete() {
  var serviceNames = [];
  $(".title").each(function() {serviceNames.push($(this).text())});

  var serviceNamesBloodhound = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: $.map(serviceNames, function(serviceName) { return { value: serviceName }; })
  });
 
  serviceNamesBloodhound.initialize();
 
  $('#search .typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
  {
    name: 'serviceNamesBloodhound',
    displayKey: 'value',
    source: serviceNamesBloodhound.ttAdapter()
  });
}

function listLoop() {

  // hide the services list initially so we can fade in
  $('#services-list').hide();

  // loop throught the different sheets
  var c = 0;
  for (var key in list) {

    // let's run this IIFE function to keep our 
    // for loop scope while we go through it
    // 'sheet' is the spreadsheet's tabulated sheet and represents list[key]
    (function(sheet) {

      // name of the service, originally from the sheet name
      serviceType = key.toString();

      if (!c) {
        createFilter('All', 'all');
      }

      // create a filter button for each serviceType
      createFilter(serviceType, sanitize(serviceType));

      // now lets get each row as "service" in k
      for (var s = 0; s < sheet.elements.length; s++) {
        (function(row){
          handleService(row);
        })(sheet.elements[s]);
      }
      sheet.elements.forEach(handleService);
      c++;
    })(list[key]);

  }

  // fade in the populated list
  $('#services-list').fadeIn(600);

  // initialize the searchable list now that it has content
  initSearch();
  initAutocomplete();
}


function handleService(service) {

  // remove the row that says "other"
  if (service.NAME === 'OTHER') {
    return;
  } else {
    var serviceElem = document.createElement('li');
    serviceElem.className = 'service ' + sanitize(serviceType);
    serviceElem.innerHTML = '<h1 class="title">' + service.NAME + '</h1>';
    serviceElem.innerHTML += '<span class="type">' + serviceType + '</span>';

    for (key in service) {
      if (service[key].length > 0 && key != 'NAME' && service[key] != 'N/A' && service[key] != 'N/a') {
        serviceElem.innerHTML += '<p class="'+key+'"><strong>' + key + '</strong><br>' + service[key] + '</p>';  
      }
    }

    document.getElementById('services-list').appendChild(serviceElem);
  }
}

function createFilter(type, sanitized) {
  
  // button for desktop
  var servicesFilterList = document.getElementById('services-filter');
  var filter = document.createElement('button');
  filter.innerHTML = type;
  filter.className = 'service-filter';
  if (type==='All') {
    filter.className += ' active';
  }
  filter.setAttribute('data', sanitized);
  filter.setAttribute('type', 'button');
  filter.addEventListener('click', filterClick, false);
  servicesFilterList.appendChild(filter);

  // select option for mobile
  var sel = document.getElementById('service-filter-select');
  var opt = document.createElement('option');
  opt.setAttribute('value', sanitized)
  opt.innerHTML = type;
  sel.appendChild(opt);

}

function sanitize(string) {
  var s = string.replace(/[^A-Z0-9]/ig, "-");
  s = s.toLowerCase();
  return s;
}

function filterClick() {

  // using jQuery here for simplicity
  if(!$(this).hasClass('active')) {
    var show = $(this).attr('data');
    doTheFilter(show);
    $('.service-filter').removeClass('active');
    $(this).addClass('active');
  }

}

function doTheFilter(fil) {
  if(fil=='all') {
    $('.service').show();  
  } else {
    $('.service').hide();
    $('.'+fil).show();
  }
}

window.onload = init();
