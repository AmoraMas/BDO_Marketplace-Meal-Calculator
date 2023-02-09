
// Set default location info
let language = 'en';    // Englist
let region = 'console_na';      // North America (PC)

// Find Input fields
const $languageInput = $('#language');
const $regionInput = $('#region');

// Find Buttons
const buttonUpdate = document.getElementById('update-location');
//const buttonHideLists = document.getElementById('quickHideList');

// Event Listeners for buttons
buttonUpdate.addEventListener('click', updateLocationInfo);
//buttonHideLists.addEventListener('click', emptyTable);

// Find page areas
//const dataArea = document.getElementById('dataArea');

// Find table areas
const $mealsList = $('.meals');

// Additional Global Variables
let allItems = [];
let allRecipies = [];

// 
//  FUNCTIONS
//

function updateLocationInfo() {
    language = $languageInput.val();
    region = $regionInput.val();
    emptyTable();
    $.get(`https://api.arsha.io/util/db/dump?lang=${language}`, (data) => { allItems = data; getAllMeals(); });
    $.get(`https://api.arsha.io/util/db/recipes/dump?lang=${language}`, (data) => { allRecipies = data; });
}


function emptyTable() {
    $mealsList.empty();
}


function getAllMeals() {
    console.log('Getting Meal List');
    let array = [];
    for (let i = 0; i < allItems.length; i++) {
        if (allItems[i].name.includes('Meal') && !allItems[i].name.includes('[Event]') && !allItems[i].name.includes('Special')) {
            let object = {};
            object['name'] = allItems[i].name;
            object['id'] = allItems[i].id;
            object['icon'] = allItems[i].icon;
            // console.log('Item: ', allItems.responseJSON[i].name, 'ID: ', allItems.responseJSON[i].id, 'Icon: ', allItems.responseJSON[i].icon);
            array.push(object);
        }
    }
    //console.log(array);
    drawTable(array);
}


function drawTable(arrayOfObjects) {
    let $tableHeader = $('<div></div>').addClass('tableHeader').text('Meals you can Craft:');
    $mealsList.append($tableHeader);

    let $table = $('<table></table>').addClass('table');

    let $thead = $('<thead></thead>').addClass('thead');
    let headers = ['Item', 'Min Enhance', 'Max Enhance', 'Base Price', 'Amount Listed', 'Total Trades', 'Min Price', 'Max Price', 'Last Sold Price', 'Last Sold Time'];
    let $tr = $('<tr></tr>');
    for (let i = 0; i < headers.length; i++) {
        let $th = $('<th></th>').text(headers[i]);
        $tr.append($th);
    }
    $thead.append($tr);
    $table.append($thead);

    let $tbody = $('<tbody></tbody>').addClass('tbody')
    for (let i = 0; i < arrayOfObjects.length; i++) {
        $.get(`https://api.arsha.io/v1/${region}/item?id=${arrayOfObjects[i].id}`, (data) => {
            //console.log('data: ', data);
            //console.log('Msg: ', data.resultMsg);
            if (data.resultMsg != '0') {
                let itemName = arrayOfObjects[i].name;
                let simplerData = (data.resultMsg).split('-');
                let $tr = $('<tr></tr>');
                //console.log(simplerData);
                for (let i = 0; i < simplerData.length; i++) {
                    //console.log('element; ', [i], 'data: ', simplerData[i]);
                    let $td = $('<td></td>');
                    if (i == 0) {
                        $td.text(itemName).addClass('link');
                        $td.click((data) => {
                            showIngredients(itemName);
                        });
                    }
                    else {
                        $td.text(simplerData[i]);
                    }
                    $tr.append($td);
                }
                //console.log('Appending: ', tr);
                $tbody.append($tr);
                $table.append($tbody);
            }
            $mealsList.append($table);
        });
    }
}


function showIngredients(itemName) {
    //console.log(data);
    //console.log(itemName);
    console.log('Getting Ingredient List: ', itemName);
    let array = [];
    for (let i = 0; i < allRecipies.length; i++) {
        if (allRecipies[i].name == itemName) {
            console.log(allRecipies[i]);

            let $container = $('<div></div>').addClass('ingredient-list');

            let $header = $('<div></div>').addClass('tableHeader');
            $header.text(`${itemName}   (${allRecipies[i].level})`);
            $container.append($header);

            let $table = $('<table></table>').addClass('table');

            let headers = ['Quantity', ['Name'], ['Price'], ['Amount Listed']];
            let $thead = $('<thead></thead>').addClass('thead')
            let $trhead = $('<tr></tr>');
            for (let i = 0; i < headers.length; i++) {
                let $th = $('<th></th>').text(headers[i]);
                $trhead.append($th);
            }
            $thead.append($trhead);
            $table.append($thead);
            let $tbody = $('<tbody></tbody>').addClass('tbody');
            for (let j = 0; j < allRecipies[i].components.length; j++) {
                console.log('Getting Ingredient: ', allRecipies[i].components[j].id);
                $('<td></td>').text($.get(`https://api.arsha.io/v1/${region}/item?id=${allRecipies[i].components[j].id}`, (data) => {
                    let $name;
                    let $tr = $('<tr></tr>');
                    let $quantity = $('<td></td>').text(allRecipies[i].components[j].quantity);
                    for (let k = 0; k < allItems.length; k++) {
                        if (allItems[k].id == allRecipies[i].components[j].id) {
                            $name = $('<td></td>').text(allItems[k].name).addClass('link');
                            $name.click(function () { showIngredients(allItems[k].name) });
                            break;
                        }
                    }
                    let $price = $('<td></td>').text((data.resultMsg).split('-')[8]);
                    let $numListed = $('<td></td>').text((data.resultMsg).split('-')[4]);
                    $tr.append($quantity);
                    $tr.append($name);
                    $tr.append($price);
                    $tr.append($numListed);
                    $tbody.append($tr);
                }));
            }
            $table.append($tbody);
            $container.append($table);
            let $pageElement = $('.ingredients');
            $pageElement.append($container);
            break;
        }
    }
}


// NOTE: Still need to work on when...
//     components.id does not exist but
//     components.materialGroup does exist
//
//     and CSS