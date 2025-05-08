sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "jquery"
], function(Controller, JSONModel, Filter, FilterOperator, Fragment, MessageToast, $) {
    "use strict";

    return Controller.extend("your.namespace.controller.Catalogs", {
        onInit: function() {
            var oModel = new JSONModel();
            var that = this;

            // Declare _oDialog as a property of the controller
            this._oDialog = null;

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
                                IMAGE: value.IMAGE,
                                ALIAS: value.ALIAS,
                                VALUEPAID: value.VALUEPAID,
                                VALUESPAID: value.VALUESPAID
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
        },

        onItemPress: function(oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext();
            var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado
            
            var sLabelID = oSelectedData.LABELID;
            var sUrl = "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" + encodeURIComponent(sLabelID);
            var that = this;
        
            $.ajax({
                url: sUrl,
                method: "GET",
                dataType: "json",
                success: function(response) {
                    var oValuesView = that.byId("XMLViewValues");
                    if (oValuesView) {
                        oValuesView.loaded().then(function() {
                            var oController = oValuesView.getController();
                            if (oController && oController.loadValues) {
                                // Pasa los valores y también el ítem seleccionado
                                oController.loadValues(response.value || []);
                                
                                // Actualiza el selectedValue en el modelo values
                                oValuesView.getModel("values").setProperty("/selectedValue", oSelectedData);
                            }
                        });
                    }
                },
                error: function() {
                    MessageToast.show("Error al cargar valores");
                }
            });
        }
        ,onCloseDialog: function () {
            if (this._oDialog) {
                this._oDialog.close();
            }
        }
    });
});
