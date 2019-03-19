function unwrap(payload) {
  return payload.then(
    res => res.data
  );
}

function requestToServer(payload) {
  return axios({
    url: 'https://api.mplus.org.hk/graphql',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: 'bearer 250b194f3778e837ccd8da233834f84a'
    },
    data: JSON.stringify(payload)
  });
}

function helloWorld() {
  var payload = {
    query: `{
          hello
        }`
  };

  var request = requestToServer(payload);

  return unwrap(request);
}

async function pageObject(page, pageNumber) {
  var payload = {
    query: `{
      objects(page:`+ page + `, per_page: ` + pageNumber + `) {
        id
    publicAccess
    objectNumber
    sortNumber
    title
    displayDate
    beginDate
    endDate
    dimension
    medium
    dimensionDetails{
      width
      height
      unit
    }
    classification {
      area
      category
    }
    constituents{
      gender
    }
    color {
        predominant {
          color
          value
        }
        search {
          google {
            color
            value
          }
          cloudinary {
            color
            value
          }
        }
      }
      }
    }`
  }

  var request = requestToServer(payload);

  return unwrap(request);
}

function getCatergories() {
  var payload = {
    query: `{
      categories(lang: "en", sort_field: "count", sort: "desc") {
        title
      }
    }`
  }

  var request = requestToServer(payload);

  return unwrap(request);
}

