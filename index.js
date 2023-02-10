
// API was from 
// https://documenter.getpostman.com/view/4028519/TzK2bEVg

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

// Find table areas
const $mealsList = $('.meals');
const $ingredients = $('.ingredients');

// Additional Global Variables
let allItems = [];
let allRecipies = [];
let allMaterialGroups = [];

// 
//  FUNCTIONS
//

function updateLocationInfo() {
    language = $languageInput.val();
    region = $regionInput.val();
    emptyTable();
    $.get(`https://api.arsha.io/util/db/dump?lang=${language}`, (data) => { allItems = data; getAllMeals(); });
    $.get(`https://api.arsha.io/util/db/recipes/dump?lang=${language}`, (data) => { allRecipies = data; });
    $.get(`https://api.arsha.io/util/db/recipes/matgroups/dump?lang=${language}`, (data) => { allMaterialGroups = data; });
}


function emptyTable() {
    $mealsList.empty();
    $ingredients.empty();
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
            array.push(object);
        }
    }
    //console.log(array);
    showMain(array);
}


function showMain(arrayOfObjects) {
    let $tableHeader = $('<div></div>').addClass('tableHeader').text('Meals you can Craft');
    $mealsList.append($tableHeader);

    let $table = $('<table></table>').addClass('table');

    let $thead = $('<thead></thead>').addClass('thead');
    let headers = ['Item', 'Min Enhance', 'Max Enhance', 'Base Price', '# Listed', 'Total Trades', 'Min Price', 'Max Price', 'Last Sold Price', 'Last Sold Time'];
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
                //console.log('Item: ', itemName);
                if (itemName.includes(`&#39;`)) {
                    itemName = itemName.replace('&#39;', '\'')
                }
                let simplerData = (data.resultMsg).split('-');
                let $tr = $('<tr></tr>');
                //console.log(simplerData);
                for (let i = 0; i < simplerData.length; i++) {
                    //console.log('element; ', [i], 'data: ', simplerData[i]);
                    let $td = $('<td></td>');
                    if (i == 0) {
                        $td.text(itemName).addClass('link');
                        $td.click((data) => {
                            $ingredients.empty();
                            showIngredients(itemName);
                            $tr.addClass('selected').siblings().removeClass('selected');
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
    //console.log(itemName);
    let cantFindIt = true;
    console.log('Getting Ingredient List: ', itemName);
    for (let i = 0; i < allRecipies.length; i++) {
        if (allRecipies[i].name == itemName) {
            console.log(allRecipies[i]);
            let id = allRecipies[i].id;

            let $container = $('<div></div>').addClass('ingredient-list');

            let $header = $('<div></div>').addClass('tableHeader');
            $header.text(`${itemName}   (${allRecipies[i].level})`);
            $container.append($header);

            let $table = $('<table></table>').addClass('table');

            let headers = ['Quantity', 'Name', 'Price', '# Listed'];
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
                let $name;
                let $price;
                let $numListed;
                console.log('Getting Ingredient: ', allRecipies[i].components[j].id);
                if ('materialGroup' in allRecipies[i].components[j]) {
                    let $tr = $('<tr></tr>');
                    let $quantity = $('<td></td>').text(allRecipies[i].components[j].quantity);
                    $name = $('<td></td>').text(`Material Group ${allRecipies[i].components[j].materialGroup}`).addClass('link');
                    $name.click(function () { showMaterialGroup(allRecipies[i].components[j].materialGroup) });
                    $price = $('<td></td>').text('---');
                    $numListed = $('<td></td>').text('---');

                    $tr.append($quantity);
                    $tr.append($name);
                    $tr.append($price);
                    $tr.append($numListed);
                    $tbody.append($tr);
                }
                else {
                    $('<td></td>').text($.get(`https://api.arsha.io/v1/${region}/item?id=${allRecipies[i].components[j].id}`, (data) => {
                        let $tr = $('<tr></tr>');
                        let quantity = allRecipies[i].components[j].quantity;
                        let $quantity = $('<td></td>').text(quantity);
                        let id = allRecipies[i].id;
                        for (let k = 0; k < allItems.length; k++) {
                            if (allItems[k].id == allRecipies[i].components[j].id) {
                                let name = allItems[k].name;
                                let price = (data.resultMsg).split('-')[8];
                                let numListed = (data.resultMsg).split('-')[4];

                                $name = $('<td></td>').text(name).addClass('link');
                                $name.click(function () { showIngredients(name) });
                                $price = $('<td></td>').text(price);
                                $numListed = $('<td></td>').text(numListed);

                                if (!isNaN(price) && price != undefined) {
                                    console.log('Total 1: ', $('.total.' + id).text());
                                    $('.total.' + id).text(Number($('.total.' + id).text()) + Number(price) * Number(quantity));
                                    console.log('Total 2: ', $('.total.' + id).text());
                                }
                                break;
                            }
                        }
                        $tr.append($quantity);
                        $tr.append($name);
                        $tr.append($price);
                        $tr.append($numListed);
                        $tbody.append($tr);
                    }));
                }
            }
            $table.append($tbody);
            $container.append($table);
            $ingredients.append($container);
            $totalDivs = $('<div></div>').addClass('totalDivs')
            $totalLabel = $('<div></div>').addClass('total').text('Total Cost: ');
            $totalDiv = $('<div></div>').addClass('total ' + id).text('0');
            $totalDivs.append($totalLabel);
            $totalDivs.append($totalDiv);
            $container.append($totalDivs);
            cantFindIt = false;
            break;
        }
    }
    if (cantFindIt) {
        let $container = $('<div></div>').addClass('ingredient-list');

        let $header = $('<div></div>').addClass('tableHeader');
        $header.text(`${itemName}`);

        $errorText = $('<div></div>').addClass('warning').text('No Data Found');

        $container.append($header);
        $container.append($errorText);
        $ingredients.append($container);
    }
}

function showMaterialGroup(materialGroupNumber) {
    console.log('Getting Material Group List: ', materialGroupNumber);
    for (let i = 0; i < allMaterialGroups.length; i++) {
        if (allMaterialGroups[i].id == materialGroupNumber) {
            console.log(allMaterialGroups[i]);
            let $container = $('<div></div>').addClass('materialGroup-list');
            let $header = $('<div></div>').addClass('tableHeader');
            $header.text(`Material Group: ${materialGroupNumber}`);
            $container.append($header);

            let $table = $('<table></table>').addClass('table');

            let headers = ['Name', 'Price', '# Listed'];
            let $thead = $('<thead></thead>').addClass('thead')
            let $trhead = $('<tr></tr>');
            for (let i = 0; i < headers.length; i++) {
                let $th = $('<th></th>').text(headers[i]);
                $trhead.append($th);
            }
            $thead.append($trhead);
            $table.append($thead);

            let $tbody = $('<tbody></tbody>').addClass('tbody');
            let keys = Object.keys(allMaterialGroups[i].mg);

            for (let j = 0; j < keys.length; j++) {
                console.log('Getting Ingredient: ', keys[j]);

                $('<td></td>').text($.get(`https://api.arsha.io/v1/${region}/item?id=${allMaterialGroups[i].mg[keys[j]].id}`, (data) => {
                    let $name;
                    let $price;
                    let $numListed;
                    let $tr = $('<tr></tr>');
                    for (let k = 0; k < allItems.length; k++) {
                        if (allItems[k].id == allMaterialGroups[i].mg[keys[j]].id) {
                            $name = $('<td></td>').text(allMaterialGroups[i].mg[keys[j]].name);
                            $price = $('<td></td>').text((data.resultMsg).split('-')[8]);
                            $numListed = $('<td></td>').text((data.resultMsg).split('-')[4]);
                            $tr.append($name);
                            $tr.append($price);
                            $tr.append($numListed);
                            $tbody.append($tr);
                            break;
                        }
                    }
                }));
            }
            $table.append($tbody);
            $container.append($table);
            $ingredients.append($container);
            break;
        }
    }
}
