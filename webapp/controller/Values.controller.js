sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "jquery"
], function(BaseController, JSONModel, MessageBox, MessageToast, Filter, FilterOperator, $) {
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.Values", {
        onInit: function() {
            // Modelo para los valores
            this.getView().setModel(new JSONModel({
                values: [],
                selectedValue: null
            }), "values");
            
            // Modelo para el modo de edición
            this.getView().setModel(new JSONModel({
                edit: false
            }), "editMode");
            
            // Modelo para los datos del formulario
            this.getView().setModel(new JSONModel({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: ""
            }), "newValueModel");
        },

        loadValues: function(aValues) {
            this.getView().getModel("values").setProperty("/values", aValues || []);
        },

        onItemSelect: function(oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oSelectedData = oItem.getBindingContext("values").getObject();
            // Actualiza el modelo newValueModel con los datos seleccionados
            this.getView().getModel("newValueModel").setProperty("/", {
                VALUEID: oSelectedData.VALUEID,
                VALUE: oSelectedData.VALUE,
                VALUEPAID: oSelectedData.VALUEPAID,
                ALIAS: oSelectedData.ALIAS,
                IMAGE: oSelectedData.IMAGE,
                DESCRIPTION: oSelectedData.DESCRIPTION
            });
    
            // Activa el modo de edición
            this.getView().getModel("editMode").setProperty("/edit", true);
        },

        onAddNew: function() {
            var oView = this.getView();
            oView.getModel("editMode").setProperty("/edit", false);
            oView.getModel("newValueModel").setData({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: ""
            });
            
            // Limpiar selección
            oView.getModel("values").setProperty("/selectedValue", null);
            oView.byId("valuesTable").removeSelections();
        },

        onEditValue: function() {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel");
            var oValuesModel = oView.getModel("values");
            
            // Obtener datos del formulario
            var oFormData = oNewValueModel.getData();
            var oSelectedCatalog = oValuesModel.getProperty("/selectedValue");
        
            // Validaciones
            if (!oFormData.VALUEID || !oFormData.VALUE) {
                MessageToast.show("VALUEID y VALUE son campos obligatorios");
                return;
            }
        
            // Construir objeto con todos los parámetros
            var oParams = {
                COMPANYID: 0,
                CEDIID: 0,
                LABELID: oSelectedCatalog.LABELID,
                VALUEPAID: oFormData.VALUEPAID || "",
                VALUEID: oFormData.VALUEID,
                VALUE: oFormData.VALUE,
                ALIAS: oFormData.ALIAS || "",
                SEQUENCE: 30,
                IMAGE: oFormData.IMAGE || "",
                VALUESAPID: "",
                DESCRIPTION: oFormData.DESCRIPTION || "",
                ROUTE: "",
                "DETAIL_ROW.ACTIVED": true,
                "DETAIL_ROW.DELETED": false,
                "DETAIL_ROW_REG.0.CURRENT": true,
                "DETAIL_ROW_REG.0.REGDATE": new Date().toISOString(),
                "DETAIL_ROW_REG.0.REGTIME": "1970-01-01T00:00:00.000Z",
                "DETAIL_ROW_REG.0.REGUSER": "USUARIO_ACTUAL"
            };
        
            // Configurar llamada AJAX con GET
            oView.setBusy(true);
            
            $.ajax({
                url: `http://localhost:4004/api/sec/valuesCRUD?procedure=put`,
                data: oParams,
                method: "GET",
                success: function(response) {
                    oView.setBusy(false);
                    MessageToast.show("Valor guardado correctamente");
                    this._loadValuesByLabel(oSelectedCatalog.LABELID);
                }.bind(this),
                error: function(error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al guardar: " + 
                        (error.responseJSON?.error?.message || "Error en el servidor"));
                }
            });
        },

        onCancelEdit: function() {
            this.getView().getModel("editMode").setProperty("/edit", false);
            this.onAddNew();
        },

        onSaveValues: function() {
            var oView = this.getView();
            var oNewValueModel = oView.getModel("newValueModel");
            var oValuesModel = oView.getModel("values");
            
            // Obtener datos del formulario
            var oFormData = oNewValueModel.getData();
            var oSelectedCatalog = oValuesModel.getProperty("/selectedValue");
        
            // Validaciones
            if (!oFormData.VALUEID || !oFormData.VALUE) {
                MessageToast.show("VALUEID y VALUE son campos obligatorios");
                return;
            }
        
            // Construir objeto con todos los parámetros
            var oParams = {
                COMPANYID: 0,
                CEDIID: 0,
                LABELID: oSelectedCatalog.LABELID,
                VALUEPAID: oFormData.VALUEPAID || "",
                VALUEID: oFormData.VALUEID,
                VALUE: oFormData.VALUE,
                ALIAS: oFormData.ALIAS || "",
                SEQUENCE: 30,
                IMAGE: oFormData.IMAGE || "",
                VALUESAPID: "",
                DESCRIPTION: oFormData.DESCRIPTION || "",
                ROUTE: "",
                "DETAIL_ROW.ACTIVED": true,
                "DETAIL_ROW.DELETED": false,
                "DETAIL_ROW_REG.0.CURRENT": true,
                "DETAIL_ROW_REG.0.REGDATE": new Date().toISOString(),
                "DETAIL_ROW_REG.0.REGTIME": "1970-01-01T00:00:00.000Z",
                "DETAIL_ROW_REG.0.REGUSER": "USUARIO_ACTUAL"
            };
        
            // Configurar llamada AJAX con GET
            oView.setBusy(true);
            
            $.ajax({
                url: `http://localhost:4004/api/sec/valuesCRUD?procedure=post`,
                data: oParams,
                method: "GET",
                success: function(response) {
                    oView.setBusy(false);
                    MessageToast.show("Valor guardado correctamente");
                    this._loadValuesByLabel(oSelectedCatalog.LABELID);
                }.bind(this),
                error: function(error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al guardar: " + 
                        (error.responseJSON?.error?.message || "Error en el servidor"));
                }
            });
        },

        onDeleteValue: function() {

        },

        onFilterChange: function() {
            var oTable = this.byId("valuesTable");
            var oBinding = oTable.getBinding("items");
            var valueFilterVal = this.byId("ValueSearchField").getValue();

            var aFilters = [];
            if (valueFilterVal) {
                aFilters.push(new Filter("VALUEID", FilterOperator.Contains, valueFilterVal));
            }

            oBinding.filter(aFilters);
        },

        _loadValuesByLabel: function(sLabelID) {
            var oView = this.getView();
            
            $.ajax({
                url: "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" + encodeURIComponent(sLabelID),
                method: "GET",
                success: function(data) {
                    oView.getModel("values").setProperty("/values", data.value || []);
                }.bind(this),
                error: function(error) {
                    MessageToast.show("Error al cargar valores");
                    console.error("Error loading values:", error);
                }
            });
        }
    });
});