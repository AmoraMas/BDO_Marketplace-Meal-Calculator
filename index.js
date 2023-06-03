// API was from
// https://documenter.getpostman.com/view/4028519/TzK2bEVg

// Set default location info
let language = "en"; // Englist
let region = "console_na"; // North America (PC)

// Find Input fields
const $languageInput = $("#language");
const $regionInput = $("#region");

// Find Buttons
const buttonUpdate = document.getElementById("update-location");
//const buttonHideLists = document.getElementById('quickHideList');

// Event Listeners for buttons
buttonUpdate.addEventListener("click", updateLocationInfo);

// Find table areas
const $mealsList = $(".meals");
const $ingredients = $(".ingredients");

// Additional Global Variables
let allItems = {};
let allRecipes = {};
let allMaterialGroups = {};

//
//  FUNCTIONS
//

// Function to run upon clicking the UPDATE button
// Function will get the set language and region and pull main data dumps for later reference
async function updateLocationInfo() {
  language = $languageInput.val();
  region = $regionInput.val();
  emptyTable();

  // get all game items, alters the data structure, and caches locally (references name/icon data vs displaying ID to user)
  // API provides data in an array that has to be parsed through to find a particular id. This way, can reference in o[1] time.
  // required to retrieve entire list to filter to items we want to initially show (meals in this case) and get their IDs.
  await $.get(`https://api.arsha.io/util/db/dump?lang=${language}`, (data) => {
    for (let i = 0; i < data.length; i++) {
      allItems[data[i].id] = {
        name: data[i].name,
        icon: data[i].icon,
        grade: data[i].grade,
      };
    }
    // console.log("all items", allItems); // Don't do this
    getAllMeals();
  });

  // get all material groups and the ingredients that make them up. Alter the data slightly to reduce nesting and increase lookup speed
  await $.get(
    `https://api.arsha.io/util/db/recipes/matgroups/dump?lang=${language}`,
    (data) => {
      for (let i = 0; i < data.length; i++) {
        allMaterialGroups[data[i].id] = {
          mg: data[i].mg,
        };
      }
      // console.log("all materialGroups", allMaterialGroups);
    }
  );

  // get all game Recipe, alters the data structure and caches locally (references all the ingredients for each recipe)
  // API provides data in an array that has to be parsed through to find a particular id. This way, can reference in o[1] time.
  // have to retrieve entire list because API only allows calling by ID. There is no referrence for ID between items/ingredients and Recipe
  await $.get(
    `https://api.arsha.io/util/db/recipes/dump?lang=${language}`,
    (data) => {
      for (let i = 0; i < data.length; i++) {
        /*
        // Rebuild components section due to an error in the API confusing id and materialGroup
        let components = [];
        for (let j = 0; j < data[i].components.length; j++)
          if ("materialGroup" in data[i].components[j]) {
            if (
              data[i].components[j].materialGroup >
              Object.keys(allMaterialGroups).length
            ) {
              //convert messageGroup to id
              components.push({
                id: data[i].components[j].materialGroup,
                quantity: data[i].components[j].quantity,
              });
            } else {
              components.push(data[i].components[j]);
            }
          } else {
            components.push(data[i].components[j]);
          }
        */

        // build object for each Recipe
        allRecipes[data[i].name] = {
          exp: data[i].exp,
          level: data[i].level,
          lifeskill: data[i].lifeskill,
          id: data[i].id,
          products: data[i].products,
          components: data[i].components,
        };
      }
      // console.log("all recipes", allRecipes);
    }
  );
}

// Function to clean out the web page upon clicking on UPDATE button again
function emptyTable() {
  $mealsList.empty();
  $ingredients.empty();
}

// Function to create local object consisting of information only on meals
function getAllMeals() {
  console.log("Getting Meal List");
  let filteredList = {};
  for (let key in allItems) {
    if (
      allItems[key].name.includes("Meal") &&
      !allItems[key].name.includes("[Event]") &&
      !allItems[key].name.includes("Special")
    ) {
      filteredList[key] = {
        name: allItems[key].name,
        icon: allItems[key].icon,
      };
    }
  }
  // console.log(filteredList);
  // console.log(filteredList[45406]);
  // console.log(filteredList['45406']['icon']);
  showMain(filteredList);
}

// Function to draw first table on page
// Function draws table of all in-game meals and lists all marketplace data for each meal
function showMain(itemList) {
  // console.log("showMain.itemList:", itemList);
  let $tableHeader = $("<div></div>")
    .addClass("tableHeader")
    .text("Meals you can Craft");
  $mealsList.append($tableHeader);

  let $table = $("<table></table>").addClass("table");

  let $thead = $("<thead></thead>").addClass("thead");
  // following commented out line is for showing all columns availaible. Replaced to not show Min/Max Enhance as meals have not enhancements
  // let headers = ['Item', 'Min Enhance', 'Max Enhance', 'Base Price', '# Listed', 'Total Trades', 'Min Price', 'Max Price', 'Last Sold Price', 'Last Sold Time'];
  let headers = [
    "Name",
    "Base Price",
    "Current Stock",
    "Total Trades",
    "Price Max",
    "Price Min",
    "Last Sold Price",
    "Last Sold Time",
  ];
  let $tr = $("<tr></tr>");
  for (let i = 0; i < headers.length; i++) {
    let $th = $("<th></th>").text(headers[i]);
    $tr.append($th);
  }
  $thead.append($tr);
  $table.append($thead);

  let $tbody = $("<tbody></tbody>").addClass("tbody");
  for (let id in itemList) {
    // console.log("showMain.id:", id);
    $.get(
      `https://api.arsha.io/v2/${region}/item?id=${id}&lang=${language}`,
      (data) => {
        data = data[0];
        // console.log("showMain.data:", data);
        // If we get data from the filtering function
        if (data.name != null) {
          let itemName = data.name;
          // Make reading easier by replacing apostrophes
          if (itemName.includes(`&#39;`)) {
            itemName = itemName.replace("&#39;", "'");
          }

          // Creating the row for the page
          let $tr = $("<tr></tr>");
          // Iterate through all provided fields of an item to populate the row
          for (let i = 0; i < headers.length; i++) {
            const columnName =
              headers[i].charAt(0).toLowerCase() +
              headers[i].slice(1).replaceAll(" ", "");
            // console.log("columnName:", columnName);

            let $td = $("<td></td>");
            // Make the first column clickable
            if (columnName == "name") {
              $td.text(itemName).addClass("link");
              $td.click((data) => {
                $ingredients.empty();
                showIngredients(itemName);
                $tr.addClass("selected").siblings().removeClass("selected");
              });
            } else if (columnName == "lastSoldTime") {
              // shows Last Sold Time in user's local time zone
              let lastSoldTime = new Date(
                data[columnName] * 1000
              ).toLocaleString();
              $td.text(lastSoldTime);
            } else {
              $td.text(data[columnName]);
            }
            $tr.append($td);
          }
          //console.log("Appending: ", $tr);
          $tbody.append($tr);
          $table.append($tbody);
        }
        $mealsList.append($table);
      }
    );
  }
}

// Function to draw on page the ingredients required for each clicked on recipe
function showIngredients(itemName) {
  let cantFindIt = true;
  console.log("Getting Ingredient List: ", itemName);

  if (!allRecipes[itemName]) {
    let $container = $("<div></div>").addClass("ingredient-list");

    let $header = $("<div></div>").addClass("tableHeader");
    $header.text(`${itemName}`);

    $errorText = $("<div></div>").addClass("warning").text("No Data Found");

    $container.append($header);
    $container.append($errorText);
    $ingredients.append($container);
  } else {
    console.log("showIngredients.itemRecipe:", allRecipes[itemName]);
    let id = allRecipes[itemName].id;

    let $container = $("<div></div>").addClass("ingredient-list");

    let $header = $("<div></div>").addClass("tableHeader");
    $header.text(`${itemName}   (${allRecipes[itemName].level})`);
    $container.append($header);

    let $table = $("<table></table>").addClass("table");

    let headers = ["Quantity", "Name", "Price", "Current Stock"];
    let $thead = $("<thead></thead>").addClass("thead");
    let $trhead = $("<tr></tr>");
    for (let i = 0; i < headers.length; i++) {
      let $th = $("<th></th>").text(headers[i]);
      $trhead.append($th);
    }
    $thead.append($trhead);
    $table.append($thead);
    let $tbody = $("<tbody></tbody>").addClass("tbody");
    for (let i = 0; i < allRecipes[itemName].components.length; i++) {
      let $name;
      let $price;
      let $numListed;

      // Table row for if the entry is a material group instead of an ingredient
      if ("materialGroup" in allRecipes[itemName].components[i]) {
        console.log(
          "Getting Ingredient:  mg",
          allRecipes[itemName].components[i].materialGroup
        );
        let $tr = $("<tr></tr>");
        let $quantity = $("<td></td>").text(
          allRecipes[itemName].components[i].quantity
        );
        $name = $("<td></td>")
          .text(
            `Material Group ${allRecipes[itemName].components[i].materialGroup}`
          )
          .addClass("link");
        $name.click(function () {
          showMaterialGroup(allRecipes[itemName].components[i].materialGroup);
        });
        $price = $("<td></td>").text("---");
        $numListed = $("<td></td>").text("---");

        $tr.append($quantity);
        $tr.append($name);
        $tr.append($price);
        $tr.append($numListed);
        $tbody.append($tr);
      }

      // Table row for if the entry is a regular ingredient
      else {
        console.log(
          "Getting Ingredient: ",
          allRecipes[itemName].components[i].id
        );
        $("<td></td>").text(
          $.get(
            `https://api.arsha.io/v2/${region}/item?id=${allRecipes[itemName].components[i].id}`,
            (data) => {
              data = data[0];
              // console.log("data", data);
              let $tr = $("<tr></tr>");
              const quantity = allRecipes[itemName].components[i].quantity;
              let $quantity = $("<td></td>").text(quantity);
              const id = data.id;
              const name = data.name;
              const price = data.lastSoldPrice;
              const numListed = data.currentStock;

              $name = $("<td></td>").text(name).addClass("link");
              $name.click(function () {
                showIngredients(name);
              });
              $price = $("<td></td>").text(price);
              $numListed = $("<td></td>").text(numListed);

              if (!isNaN(price) && price != undefined) {
                $(".total." + id).text(
                  Number($(".total." + id).text()) +
                    Number(price) * Number(quantity)
                );
              }
              $tr.append($quantity);
              $tr.append($name);
              $tr.append($price);
              $tr.append($numListed);
              $tbody.append($tr);
            }
          )
        );
      }
    }
    $table.append($tbody);
    $container.append($table);
    $ingredients.append($container);
    $totalDivs = $("<div></div>").addClass("totalDivs");
    $totalLabel = $("<div></div>").addClass("total").text("Total Cost: ");
    $totalDiv = $("<div></div>")
      .addClass("total " + id)
      .text("0");
    $totalDivs.append($totalLabel);
    $totalDivs.append($totalDiv);
    $container.append($totalDivs);
  }
}

// Function to draw a table in the ingredients area the items that make up a Material Group
// The material group is a list of items that can be substituted into the recipe (pick any of)
function showMaterialGroup(mgID) {
  console.log("Getting Material Group List: ", mgID);
  console.log(allMaterialGroups[mgID]);
  let $container = $("<div></div>").addClass("materialGroup-list");
  let $header = $("<div></div>").addClass("tableHeader");
  $header.text(`Material Group: ${mgID}`);
  $container.append($header);

  let $table = $("<table></table>").addClass("table");

  let headers = ["Name", "Price", "# Listed"];
  let $thead = $("<thead></thead>").addClass("thead");
  let $trhead = $("<tr></tr>");
  for (let i = 0; i < headers.length; i++) {
    let $th = $("<th></th>").text(headers[i]);
    $trhead.append($th);
  }
  $thead.append($trhead);
  $table.append($thead);

  let $tbody = $("<tbody></tbody>").addClass("tbody");

  for (let key in allMaterialGroups[mgID].mg) {
    console.log("Getting Ingredient: ", allMaterialGroups[mgID].mg[key].name);
    $("<td></td>").text(
      $.get(`https://api.arsha.io/v2/${region}/item?id=${key}`, (data) => {
        let $name;
        let $price;
        let $numListed;
        let $tr = $("<tr></tr>");
        $name = $("<td></td>").text(allMaterialGroups[mgID].mg[key].name);
        $price = $("<td></td>").text(data.resultMsg.split("-")[8]);
        $numListed = $("<td></td>").text(data.resultMsg.split("-")[4]);
        $tr.append($name);
        $tr.append($price);
        $tr.append($numListed);
        $tbody.append($tr);
      })
    );
  }
  $table.append($tbody);
  $container.append($table);
  $ingredients.append($container);
}
