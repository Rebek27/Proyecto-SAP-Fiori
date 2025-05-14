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

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.catalogs.Values", {
        // Método de inicialización del controlador
        onInit: function() {
            // Modelo para los valores
            this.getView().setModel(new JSONModel({
                values: [],
                selectedValue: null
            }), "values");
            this.getView().setModel(new JSONModel({
                    values: [],       // Datos de la tabla
                    selectedValueIn: null  // 🔥 Para controlar los botones
            }), "values");
            
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
        // Método para cargar los valores en el modelo
        loadValues: function(aValues) {
            this.getView().getModel("values").setProperty("/values", aValues || []);
        },
        // Método para abrir el diálogo de selección de valores
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
             this.getView().getModel("values").setProperty("/selectedValueIn", true);
        },
        // Método para esditar el nuevo valor
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
                // Estructura anidada para DETAIL_ROW
                "DETAIL_ROW": {
                    "ACTIVED": true,
                    "DELETED": false
                },
                "DETAIL_ROW_REG": [
                        
                    ]
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
        // Método para guardar un nuevo valor
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
                // Estructura anidada para DETAIL_ROW
                "DETAIL_ROW": {
                    "ACTIVED": true,
                    "DELETED": false
                },
                "DETAIL_ROW_REG": [
                        
                    ]
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
        //FILTRO DE VALORES
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
        },
        StatusValueDecline: function() {
            this.StatusValue(false,true,"delete");
        },
        StatusValueAccept: function() {
            this.StatusValue(true,false,"actived");
        },
        StatusValue: function(aceptar, rechazar,type) {
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
                // Estructura anidada para DETAIL_ROW
                "DETAIL_ROW": {
                    "ACTIVED": aceptar,
                    "DELETED": rechazar
                },
            };
        
            // Configurar llamada AJAX con GET
            oView.setBusy(true);
            
            $.ajax({
                url: `http://localhost:4004/api/sec/valuesCRUD?procedure=${type}&labelID=${oSelectedCatalog.LABELID}&ValueID=${oFormData.VALUEID}`,
                data: oParams,
                method: "GET",
                success: function(response) {
                    oView.setBusy(false);
                    if(aceptar==true){
                        MessageToast.show("Valor activado correctamente");
                    }else{
                        MessageToast.show("Valor desactivado correctamente");
                    }
                    this._loadValuesByLabel(oSelectedCatalog.LABELID);
                }.bind(this),
                error: function(error) {
                    oView.setBusy(false);
                    MessageToast.show("Error al activar: " + 
                        (error.responseJSON?.error?.message || "Error en el servidor"));
                }
            });
        },
        onDeleteValue: function() {
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

            // 🔥 Mensaje de confirmación antes de eliminar
            MessageBox.confirm("¿ESTÁS SEGURO DE ELIMINAR PERMANENTEMENTE ESTE DATO?", {
                title: "Confirmar Eliminación",
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // ✅ Si el usuario presiona "OK", ejecuta la eliminación
                        oView.setBusy(true);
                
                        $.ajax({
                            url: `http://localhost:4004/api/sec/valuesCRUD?procedure=deletePermanent&labelID=${oSelectedCatalog.LABELID}&ValueID=${oFormData.VALUEID}`,
                            method: "GET",
                            success: function(response) {
                                oView.setBusy(false);
                                MessageToast.show("Valor eliminado correctamente"); // 🔥 Mensaje actualizado
                                this._loadValuesByLabel(oSelectedCatalog.LABELID);
                            }.bind(this),
                            error: function(error) {
                                oView.setBusy(false);
                                MessageToast.show("Error al eliminar: " + 
                                    (error.responseJSON?.error?.message || "Error en el servidor"));
                            }  
                        });
                }
        }.bind(this)
    });
    }
    });
});