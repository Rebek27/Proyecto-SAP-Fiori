sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "jquery"
], function(Controller, JSONModel, Filter, FilterOperator, $) {
    "use strict";

    return Controller.extend("your.namespace.controller.Catalogs", {
        onInit: function() {
            var oModel = new JSONModel();
            var that = this;

            // Cargar datos desde el endpoint
            $.ajax({
                url: "http://localhost:4004/api/sec/catalogsR?procedure=get&type=all",
                method: "GET",
                success: function(data) {
                    let flattenedData = [];

                    data.value.forEach(function(catalog) {
                        catalog.VALUES.forEach(function(value) {
                            flattenedData.push({
                                LABELID: catalog.LABELID,
                                LABEL: catalog.LABEL,
                                VALUEID: value.VALUEID,
                                VALUE: value.VALUE,
                                DESCRIPTION: value.DESCRIPTION,
                                IMAGE: value.IMAGE
                            });
                        });
                    });

                    oModel.setData({ value: flattenedData });
                    that.getView().setModel(oModel);
                }
            });
        },

        onFilterChange: function() {
            var oTable = this.byId("catalogTable");
            var oBinding = oTable.getBinding("items");

            var labelFilterVal = this.byId("labelFilter").getValue();
            var valueFilterVal = this.byId("valueFilter").getValue();

            var aFilters = [];

            if (labelFilterVal) {
                aFilters.push(new Filter("LABELID", FilterOperator.Contains, labelFilterVal));
            }
            if (valueFilterVal) {
                aFilters.push(new Filter("VALUEID", FilterOperator.Contains, valueFilterVal));
            }

            oBinding.filter(aFilters);
        }
    });
});
