"use strict";

let projectId = 'a3bffdf8-2ee6-40e8-a1fc-4a000dda3069'; // https://dev.apps.ciena.com/planner-plus-ui/design-wizard/#design-id=1d4f6aa2-9568-458e-a25b-696d0e592861&auto-pan-zoom=true&networkView=siteView&omsView=false&flow=DirectEdit&step=network-elements
let reportName = 'networkelements';
let gridOptions;
let reportSchema;


async function myFunction() {
    console.log('Hello');
    //let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    let url = "https://localhost/equipmenttopologyplanning/api/v1/networks/8205c801-f7d8-4c59-8f88-de904392e8b0/fibers/report/exportcsv";
    //let key = "reportingParams";
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Name", "id": "name" }] };

    var form = $('<form></form>').attr('action', url).attr('method', 'post');
    // Add the one key/value
    //form.append($("<input></input>").attr('type', 'hidden').attr('name', 'export').attr('value', 'true'));
    form.append($("<input></input>").attr('type', 'hidden').attr('name', 'gridName').attr('value', 'fibers'));
    form.append($("<input></input>").attr('type', 'hidden').attr('name', 'columnHeaders').attr('value', '[{ "header": "Name", "id": "name" }]'));
    //send request
    form.appendTo('body').submit().remove();

}

async function myFunction7() {
    console.log('Hello');
    //let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    let url = "https://localhost/equipmenttopologyplanning/api/v1/networks/8205c801-f7d8-4c59-8f88-de904392e8b0/fibers/report?";
    //let key = "reportingParams";
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };
    let data = { "startRow": 0, "endRow": 3, "rowGroupCols": [], "valueCols": [], "pivotCols": [], "pivotMode": false, "groupKeys": [], "filterModel": [], "sortModel": [], "pageSize": 3, "pageNumber": 2, "filterExpression": "" };
    //let data = undefined;

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(function (resp) {
        return console.log(resp);
    });

}

async function myFunction6() {
    console.log('Hello');
    let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    //let url = "https://localhost/equipmenttopologyplanning/api/v1/networks/8205c801-f7d8-4c59-8f88-de904392e8b0/fibers/report";
    let key = "reportingParams";
    let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Name", "id": "name" }] };



    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(function (resp) {
        const returnedFile = new Blob([resp], { type: 'application/csv' });
        FileSaver.saveAs(returnedFile);
    });


}

async function myFunction5() {
    console.log('Hello');
    let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    //let url = "https://localhost/equipmenttopologyplanning/api/v1/networks/8205c801-f7d8-4c59-8f88-de904392e8b0/fibers/report";
    let key = "reportingParams";
    let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Name", "id": "name" }] };



    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(function (resp) {
        return resp.blob();
    }).then(function (blob) {
        return download(blob, "CUSTOM_NAME.csv");
    });


}

async function myFunction4() {
    console.log('Hello');
    //let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    let url = "https://localhost/equipmenttopologyplanning/api/v1/networks/8205c801-f7d8-4c59-8f88-de904392e8b0/fibers/report";
    let key = "reportingParams";
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };
    let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Name", "id": "name" }] };


    var form = $('<form></form>').attr('action', url).attr('method', 'post');
    // Add the one key/value
    form.append($("<input></input>").attr('type', 'hidden').attr('name', key).attr('value', data));
    //send request
    form.appendTo('body').submit().remove();

    
}


async function myFunction3() {
    console.log('Hello');
    //let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    let url = "https://localhost/equipmenttopologyplanning/api/v1/networks/8205c801-f7d8-4c59-8f88-de904392e8b0/fibers/report";
    let key = "reportingParams"
    //let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };
    let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Name", "id": "name" }] };

    fetch(url,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => console.log(res));
}


async function myFunction2() {
    console.log('Hello');
    let url = "https://localhost/equipmenttopologyplanning/api/v1/Reports/equipment/8205c801-f7d8-4c59-8f88-de904392e8b0";
    let key = "reportingParams"
    let data = { "export": "true", "gridName": "equipment", "columnHeaders": [{ "header": "Site ID", "id": "siteID" }, { "header": "Name", "id": "name" }, { "header": "Product type", "id": "node_productType" }, { "header": "PEC", "id": "equipmentSpec_partNumber" }, { "header": "Card description", "id": "equipmentSpec_description" }, { "header": "Site name", "id": "node_siteName" }, { "header": "Name (TID)", "id": "node_tid" }, { "header": "Shelf id", "id": "location_shelf" }, { "header": "Slot", "id": "location_slot" }, { "header": "Subslot", "id": "location_subSlot" }, { "header": "Width", "id": "width" }, { "header": "Planning phase", "id": "planningState_planningPhase_name" }, { "header": "Planning status", "id": "planningState_planningStatus" }, { "header": "Planning source", "id": "planningState_planningSource" }, { "header": "Planning timestamp", "id": "planningState_planningTimestamp" }, { "header": "Serial number", "id": "equipmentSpec_serialNumber" }, { "header": "Manufacturing date", "id": "equipmentSpec_manufacturingDate" }, { "header": "Age", "id": "equipmentSpec_age" }, { "header": "Id", "id": "id" }, { "header": "Spare Equipment", "id": "spareEquipment" }, { "header": "Domain", "id": "domain" }, { "header": "Equipment Group (OTS)", "id": "equipmentGroup" }, { "header": "Release", "id": "releaseVersion" }, { "header": "Photonic SNC", "id": "photonicSncName" }, { "header": "On Since", "id": "onSince" }, { "header": "Notes", "id": "notes" }, { "header": "Bay", "id": "bay" }, { "header": "Physical shelf", "id": "physicalShelf" }, { "header": "port", "id": "port" }] };

    var form = $('<form></form>').attr('action', url).attr('method', 'post');
    // Add the one key/value
    form.append($("<input></input>").attr('type', 'hidden').attr('name', key).attr('value', data));
    //send request
    form.appendTo('body').submit().remove();
}

