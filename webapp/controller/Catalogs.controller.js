sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast", // Ensure MessageToast is imported
    "jquery",
  ],
  function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    Fragment,
    MessageToast,
    $
  ) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.Catalogs",
      {
        onInit: function () {
          var oModel = new JSONModel();
          var that = this;

          // Declare _oDialog as a property of the controller
          this._oDialog = null;

          // Cargar datos desde el endpoint
          $.ajax({
            url: "http://localhost:4004/api/sec/getall",
            method: "GET",
            success: function (data) {
              /* let flattenedData = [];

              data.value.forEach(function (catalog) {
                catalog.VALUES.forEach(function (value) {
                  flattenedData.push({
                    LABELID: catalog.LABELID,
                    LABEL: catalog.LABEL,
                    VALUEID: value.VALUEID,
                    VALUE: value.VALUE,
                    DESCRIPTION: value.DESCRIPTION,
                    IMAGE: value.IMAGE,
                    ALIAS: value.ALIAS,
                    VALUEPAID: value.VALUEPAID,
                    VALUESPAID: value.VALUESPAID,
                  });
                });
              }); */

              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);
            },
          });
        },

        onFilterChange: function () {
          var oTable = this.byId("catalogTable");
          var oBinding = oTable.getBinding("items");

          var labelFilterVal = this.byId("labelFilter").getValue();
          var valueFilterVal = this.byId("valueFilter").getValue();

          var aFilters = [];

          if (labelFilterVal) {
            aFilters.push(
              new Filter("LABELID", FilterOperator.Contains, labelFilterVal)
            );
          }
          if (valueFilterVal) {
            aFilters.push(
              new Filter("VALUEID", FilterOperator.Contains, valueFilterVal)
            );
          }

          oBinding.filter(aFilters);
        },

        onItemPress: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;
          var sUrl =
            "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" +
            encodeURIComponent(sLabelID);
          var that = this;

          $.ajax({
            url: sUrl,
            method: "GET",
            dataType: "json",
            success: function (response) {
              var oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();
                  if (oController && oController.loadValues) {
                    // Pasa los valores y también el ítem seleccionado
                    oController.loadValues(response.value || []);

                    // Actualiza el selectedValue en el modelo values
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            },
            error: function () {
              MessageToast.show("Error al cargar valores");
            },
          });

          // Expandir el panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("100%"); // O el porcentaje/píxeles que prefieras
          }

          // Opcional: reducir el panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0%");
          }
        },
        onCloseDialog: function () {
          if (this._oDialog) {
            this._oDialog.close();
          }
        },
        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },
        onAddLabel: function () {
          // Modelo vacío para el formulario
          var oModel = new sap.ui.model.json.JSONModel({
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "",
            SEQUENCE: "",
            IMAGE: "",
            DESCRIPTION: "",
          });
          this.getView().setModel(oModel, "addLabelModel");

          // Cargar el fragmento solo una vez
          if (!this._oAddLabelDialog) {
            var oView = this.getView();
            sap.ui.core.Fragment.load({
              id: oView.getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.AddLabelDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oAddLabelDialog = oDialog;
                oView.addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddLabelDialog.open();
          }
        },
        onSaveLabel: function () {
          var oModel = this.getView().getModel("addLabelModel");
          var oData = oModel.getData();
          // Enviar datos a la API
          $.ajax({
            url: "http://localhost:4004/api/sec/catalogsR", // Cambia la URL según tu API
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(oData),
            success: function (response) {
              MessageToast.show("Label agregado correctamente"); // Use the imported MessageToast
              this._oAddLabelDialog.close();
              // Aquí puedes recargar la tabla si lo deseas
            }.bind(this),
            error: function () {
              MessageToast.show("Error al agregar label");
            },
          });
        },

        onCancelAddLabel: function () {
          if (this._oAddLabelDialog) {
            this._oAddLabelDialog.close();
          }
        },
      }
    );
  }
);
