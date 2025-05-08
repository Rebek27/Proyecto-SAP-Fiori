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
            var oSelectedItem = oEvent.getParameter("listItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext("values");
                var oSelectedData = oContext.getObject();
                this.getView().getModel("values").setProperty("/selectedValue", oSelectedData);
            }
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
            var oSelected = this.getView().getModel("values").getProperty("/selectedValue");
            if (oSelected) {
                this.getView().getModel("editMode").setProperty("/edit", true);
                this.getView().getModel("newValueModel").setData(Object.assign({}, oSelected));
            } else {
                MessageToast.show("Por favor seleccione un valor para editar");
            }
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
                procedure: "post",  // Parámetro requerido por tu API
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
        
            // Convertir a cadena de parámetros URL
            var sParams = Object.keys(oParams)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oParams[key])}`)
                .join('&');
        
            // Configurar llamada AJAX con GET
            oView.setBusy(true);
            
            $.ajax({
                url: `http://localhost:4004/api/sec/valuesCRUD?${sParams}`,
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
            var oView = this.getView();
            var oSelected = oView.getModel("values").getProperty("/selectedValue");
            
            if (!oSelected) {
                MessageToast.show("Por favor seleccione un valor para eliminar");
                return;
            }
            
            MessageBox.confirm("¿Está seguro de eliminar este valor?", {
                title: "Confirmar eliminación",
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oView.setBusy(true);
                        
                        $.ajax({
                            url: "http://localhost:4004/api/sec/valuesCRUD?procedure=delete&labelID=" + 
                                  encodeURIComponent(oSelected.LABELID) + "&valueID=" + 
                                  encodeURIComponent(oSelected.VALUEID),
                            method: "DELETE",
                            success: function() {
                                oView.setBusy(false);
                                MessageToast.show("Valor eliminado correctamente");
                                this._loadValuesByLabel(oSelected.LABELID);
                                this.onAddNew();
                            }.bind(this),
                            error: function(error) {
                                oView.setBusy(false);
                                MessageBox.error("Error al eliminar: " + 
                                    (error.responseJSON ? error.responseJSON.error.message : "Error en el servidor"));
                            }
                        });
                    }
                }.bind(this)
            });
        },

        onSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("valuesTable");
            var oBinding = oTable.getBinding("items");
            
            if (sQuery) {
                var aFilters = [
                    new Filter("VALUEID", FilterOperator.Contains, sQuery),
                    new Filter("VALUE", FilterOperator.Contains, sQuery),
                    new Filter("ALIAS", FilterOperator.Contains, sQuery)
                ];
                oBinding.filter(new Filter({
                    filters: aFilters,
                    and: false
                }));
            } else {
                oBinding.filter([]);
            }
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