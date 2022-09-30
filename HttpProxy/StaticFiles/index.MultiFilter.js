"use strict";

let projectId = 'a3bffdf8-2ee6-40e8-a1fc-4a000dda3069'; // https://dev.apps.ciena.com/planner-plus-ui/design-wizard/#design-id=1d4f6aa2-9568-458e-a25b-696d0e592861&auto-pan-zoom=true&networkView=siteView&omsView=false&flow=DirectEdit&step=network-elements
let reportName = 'networkelements';
let gridOptions;
let reportSchema;

function ConstructColumnDefinitions(reportSchema, columnNameToUpdate, newColDef) {
    let columnDefinitions = new Array();

    for (let columnName in reportSchema.properties) {
        let { agGridFilterType, precision } = GetAGGridFilterTypeForColumn(reportSchema, columnName);
        if (agGridFilterType === null) {
            continue;
        }

        if (columnName === columnNameToUpdate && columnNameToUpdate !== null && columnNameToUpdate !== undefined) {
            columnDefinitions.push(newColDef);
        }
        else {
            //columnDefinitions.push({ field: columnName, filter: agGridFilterType });
            columnDefinitions.push(
                {
                    field: columnName,
                    filter: 'agMultiColumnFilter',
                    filterParams: {
                        filters: [
                            {
                                filter: 'agSetColumnFilter',
                                filterParams: {
                                    values: getDistinctValuesAsync,
                                    excelMode: 'windows',
                                }
                            },
                            {
                                filter: agGridFilterType
                            }

                        ]
                    }
                });
        }
    }

    return columnDefinitions;
}

async function getGridOptions(projectId, reportName) {
    let uriReportSchema = 'https://localhost/equipmenttopologyplanning/api/v1/Reports/schema?reportName=' + reportName;
    reportSchema = await FetchReportSchema(projectId, uriReportSchema, reportName);
    let columnDefinitions = ConstructColumnDefinitions(reportSchema);

    //for (let columnName in reportSchema.properties) {
    //    let { agGridFilterType, precision } = GetAGGridFilterTypeForColumn(reportSchema, columnName);
    //    if (agGridFilterType === null) {
    //        continue;
    //    }

    //    if (columnName === "siteId") {
    //        agGridFilterType = 'agSetColumnFilter';
    //        columnDefinitions.push(
    //            {
    //                field: columnName,
    //                filter: agGridFilterType,
    //                filterParams: {
    //                    values: getDistinctValuesAsync,
    //                    excelMode: 'windows',
    //                }
    //            });
    //    }
    //    else {
    //        columnDefinitions.push({ field: columnName, filter: agGridFilterType });
    //    }
    //}

    let gridOptions = {
        columnDefs: columnDefinitions,
        defaultColDef: {
            flex: 1,
            minWidth: 100,
        },

        animateRows: true,

        rowModelType: 'serverSide',
        serverSideStoreType: 'partial',

        //onFilterChanged: onFilterChanged,
        onFilterOpened: onFilterOpened
    };

    return gridOptions;
}

function GetAGGridFilterTypeForColumn(reportSchema, columnName) {
    let prop = reportSchema.properties[columnName];
    let propertyType = prop.type; // Eg "string"
    let actualDataType;
    let precision;
    if (prop.hasOwnProperty("meta")) {
        if (prop.meta.properties.hasOwnProperty("actualDataType")) {
            actualDataType = prop.meta.properties.actualDataType; // Eg "date"
        }
        if (prop.meta.properties.hasOwnProperty("precision")) {
            precision = prop.meta.properties.precision; // But this is not required for verification - it will be required for equals, but for that we are verifying by its Text filter equivalent
        }
    }

    let agGridFilterType = 'agSetColumnFilter';
    if ((propertyType === "integer" || propertyType === "number")
        || (propertyType === "string" && actualDataType === "double")) {
        agGridFilterType = 'agNumberColumnFilter';
    }
    else if (actualDataType === "date") {
        agGridFilterType = 'agDateColumnFilter';
    }
    else if (propertyType === "string") {
        agGridFilterType = 'agTextColumnFilter';
    }
    else {
        agGridFilterType = null;
    }

    return { agGridFilterType, precision };
}

//function onFilterChanged(event) {
//    console.log('onFilterChanged: Refresh Set Filter Values');
//    console.log(event);

//    //var siteIdFilter = gridOptions.api.getFilterInstance('siteId');
//    //siteIdFilter.refreshFilterValues();
//}

//async function onFilterOpened(event) {
//    // This gets called as soon as the icon of 3 lines is clicked, even before we've clicked on the filter icon
//    // Lets try to call the Get Options for Set Filter at this time, and see if we can change it at runtime

//    console.log('onFilterOpened');
//    console.log(event);

//    let colDef = event.column.colDef;
//    let columnName = colDef.field;
//    let newColDef;

//    if (colDef.filter !== 'agSetColumnFilter') {
//        // If its not Set Filter

//        console.log(`Current filter is ${colDef.filter}. Changing to Set`);

//        let distinctValues = await FetchDistinctValuesForColumn(columnName);

//        //if (distinctValues.length < 10) {
//            newColDef = {
//                field: columnName,
//                filter: 'agSetColumnFilter',
//                filterParams: {
//                    values: getDistinctValuesAsync,
//                    excelMode: 'windows',
//                },
//                //filter: 'agTextColumnFilter',
//                //headerName: 'X'
//            };
//        //}
//    }
//    else {
//        // If current filter is Set Filter
//        // Just for fun, reverse from Set Filter back to original filter
//        let { agGridFilterType, precision } = GetAGGridFilterTypeForColumn(reportSchema, columnName);

//        console.log(`Current filter is Set Filter. Changing it to ${agGridFilterType}`);


//        newColDef = {
//            field: columnName,
//            filter: agGridFilterType
//        };
//    }

//    if (newColDef !== null && newColDef !== undefined) {
//        let newColDefns = ConstructColumnDefinitions(reportSchema, columnName, newColDef);

//        gridOptions.api.setColumnDefs(newColDefns);
//    }
//}


async function onFilterOpened(event) {
    console.log('onFilterOpened. event = ');
    console.log(event);

    //event.column.colDef.field // ColumnName
    if (event.column.colDef.filter === "agMultiColumnFilter") {
        //let setFilter = event.column.colDef.filterParams.filters.filter(p => p.filter === "agSetColumnFilter");
        //if (setFilter !== null && setFilter !== undefined) {
        //    setFilter.refreshFilterValues();
        //}

        //let ageFilter = gridOptions.api.getFilterInstance(event.column.colDef.field);
        //ageFilter.refreshFilterValues();

        gridOptions.api.getFilterInstance(function (e, t) {
            console.log(e);
            console.log(t);
        });
    }

}

async function getDistinctValuesAsync(params) {
    // This is the callback we set in grid options

    console.log('getDistinctValuesAsync');

    // params.colDef.field === 'siteId'
    let distinctValues = await FetchDistinctValuesForColumn(params.colDef.field);
    if (distinctValues.length > 10) {
        params.success([]);
    }
    else {
        params.success(distinctValues);
    }
}

async function FetchDistinctValuesForColumn(columnName) {

    // TODO : This needs to be replaced with an actual API that would return unique siteId values

    // Fetch Report with no filters
    let gridDataNoFilter = await GetGridDataNoFilter();
    if (gridDataNoFilter === null || gridDataNoFilter === undefined || !gridDataNoFilter.hasOwnProperty("data") || gridDataNoFilter.data.length === 0) {
        return;
    }

    let { agGridFilterType, precision } = GetAGGridFilterTypeForColumn(reportSchema, columnName);

    let allValues = gridDataNoFilter.data.map(
        function (p) {
            if (p.hasOwnProperty(columnName)) {
                let val = p[columnName];
                if (agGridFilterType === "agDateColumnFilter") {
                    val = val.substring(0, 10);
                }
                else if (precision !== null && precision !== undefined) {
                    //val = +val.toFixed(precision); // TODO : Just for the sake of it .. this may not be accurate
                    console.log(val);
                    val = +val; // TODO : Just for the sake of it .. this may not be accurate
                }

                return val;
            }
            return null;
        });

    let distinctValues = [...new Set(allValues)];

    return distinctValues;
}

async function GetGridDataNoFilter() {

    let reportDataUriBase = GetReportDataUriBase(reportName, projectId);
    if (reportDataUriBase === null || reportDataUriBase === undefined) {
        console.log(`No URI defined for report ${reportName}`);
        return null;
    }

    let reportingParamsNoFilter = '{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[],"sortModel":[],"pageSize":400,"pageNumber":1,"filterExpression":""}';
    let reportDataUriNoFilter = reportDataUriBase + '&reportingParams=' + reportingParamsNoFilter;

    // Fetch Report with no filters
    let gridDataNoFilter = await FetchGridData(reportDataUriNoFilter);
    return gridDataNoFilter;
}

async function FetchReportSchema(projectId, uriReportSchema, reportName) {
    var response = await fetch(uriReportSchema, {
        headers: {
            'Content-Type': 'application/json',
        }
    });
    var data = await response.json();
    document.getElementById("demo").innerHTML += "[#] " + reportName + " - " + uriReportSchema + "<br>";
    let reportSchema = JSON.parse(data);
    //console.log(reportSchema);
    return reportSchema;
}

function GetReportDataUriBase(reportName, projectId) {
    let server = "localhost"
    if (reportName === "equipment") {
        return `https://${server}/equipmenttopologyplanning/api/v1/Reports/equipment/${projectId}?useNetworkDescriptions=true`;
    }
    else if (reportName === "csampprovisioning") {
        return `https://${server}/equipmenttopologyplanning/api/v1/Reports/csampprovisioning/${projectId}?includePowerTable=true`;
    }
    else if (reportName === "networkelements") {
        return `https://${server}/equipmenttopologyplanning/api/v1/Reports/networkelements/${projectId}?`;
    }

    return null;
}


async function FetchGridData(reportDataUri) {
    try {
        var response = await fetch(reportDataUri, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        let gridData = await response.json();
        return gridData;
    }
    catch (ex) {
        console.log(`Exception: FetchGridData ${reportDataUri}`);
        console.log(ex);
        return null;
    }
}

async function myFunction() {
    console.log('Hello');
    var gridDiv = document.querySelector('#myGrid');

    gridOptions = await getGridOptions(projectId, reportName);
    new agGrid.Grid(gridDiv, gridOptions);

    let gridDataNoFilter = await GetGridDataNoFilter();
    if (gridDataNoFilter === null || gridDataNoFilter === undefined) {
        return;
    }

    let dataSource =
    {
        getRows: function (params) {
            console.log('getRows: params:');
            console.log(params);

            FormatGridData(gridDataNoFilter.data);

            params.success(
                {
                    rowData: gridDataNoFilter.data,
                    rowCount: gridDataNoFilter.data.length 
                });
        }
    };

    gridOptions.api.setServerSideDatasource(dataSource);
}

function FormatGridData(gridDataUnformatted) {
    gridDataUnformatted.forEach(function (row, index) {
        for (let columnName in reportSchema.properties) {
            let { agGridFilterType, precision } = GetAGGridFilterTypeForColumn(reportSchema, columnName);
            if (agGridFilterType === "agDateColumnFilter") {
                let value = row[columnName];
                row[columnName] = row[columnName].substring(0, 10);
                console.log(`${columnName}: ${value} => ${row[columnName]}`);
            }
            else if (precision !== null && precision !== undefined) {
                let value = row[columnName];
                console.log(value);
                //row[columnName] = +row[columnName].toFixed(precision); // TODO : Just for the sake of it .. this may not be accurate
                row[columnName] = +row[columnName]; // TODO : Just for the sake of it .. this may not be accurate
                console.log(`${columnName}: ${value} => ${row[columnName]}`);
            }
        }
    });
}


//async function f2() {
//    let event = {
//        column: {
//            colDef: {
//                field: "name",
//                filter: "agTextColumnFilter"
//            }
//        }
//    };

//    await onFilterOpened(event);
//}
