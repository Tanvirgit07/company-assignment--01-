import React, { useState, useEffect, useRef } from "react";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Container, Row, Col } from "react-bootstrap";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { FaAngleDown } from "react-icons/fa";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: string;
  date_end: string;
}

const YourComponent: React.FC = () => {
  const [products, setProducts] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const rows = 12;

  const [selectedProducts, setSelectedProducts] = useState<Artwork[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");

  const op = useRef<OverlayPanel>(null);

  
  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
      );
      const data = await response.json();
      setProducts(data.data);
      setTotalRecords(data.pagination.total);

      // Retrieve saved selected rows from local storage
      const savedSelection = localStorage.getItem('selectedRows');
      if (savedSelection) {
        const savedIds = JSON.parse(savedSelection) as number[];
        // Maintain selection in UI based on local storage
        const newSelection = data.data.filter((item: { id: number; }) => savedIds.includes(item.id));
        setSelectedProducts(prev => [...prev, ...newSelection]);
        setSelectAll(savedIds.length === data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  
  const onPageChange = (event: DataTableStateEvent) => {
    setPage(event.page! + 1);
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
    setSelectedProducts(e.value);
    setSelectAll(e.value.length === products.length);
  };

  
  const handleCheckboxChange = (rowData: Artwork) => {
    const isSelected = selectedProducts.some(
      (product) => product.id === rowData.id
    );
    const updatedSelection = isSelected
      ? selectedProducts.filter((product) => product.id !== rowData.id)
      : [...selectedProducts, rowData];
      
    setSelectedProducts(updatedSelection);

    
  };

  
  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setSelectedProducts(products); 
    } else {
      setSelectedProducts([]); 
    }
    setSelectAll(event.target.checked);

    
  };

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  
  const selectRowsAcrossPages = async (
    remaining: number,
    currentPage: number,
    selected: Artwork[]
  ) => {
    if (remaining <= 0) return selected;

    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${rows}`
    );
    const data = await response.json();

    const newSelected = [...selected, ...data.data.slice(0, remaining)];
    const remainingRows = remaining - data.data.length;

    if (remainingRows > 0 && currentPage * rows < totalRecords) {
      return await selectRowsAcrossPages(
        remainingRows,
        currentPage + 1,
        newSelected
      );
    }

    return newSelected;
  };

  const handleSubmit = async () => {
    const numberOfRowsToSelect = parseInt(inputValue);

    // Start selecting rows across pages
    const selected = await selectRowsAcrossPages(
      numberOfRowsToSelect,
      page,
      []
    );

    setSelectedProducts(selected);

    // Save selected rows to local storage
    const selectedIds = selected.map(item => item.id);
    localStorage.setItem('selectedRows', JSON.stringify(selectedIds));

    op.current?.hide();
  };

  const handleButtonClick = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    op.current?.toggle(e);
  };

  const renderCheckboxHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAllChange}
          style={{
            marginRight: "8px",
            width: "18px",
            height: "18px",
            cursor: "pointer",
          }}
        />
        <FaAngleDown
          style={{
            color: "#007bff",
            fontSize: "1.5em",
            cursor: "pointer",
            transition: "color 0.2s ease-in-out",
          }}
          onClick={handleButtonClick}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#0056b3")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#007bff")}
        />
      </div>
    );
  };

  const rowCheckboxBodyTemplate = (rowData: Artwork) => {
    return (
      <input
        type="checkbox"
        checked={selectedProducts.some((product) => product.id === rowData.id)}
        onChange={() => handleCheckboxChange(rowData)}
      />
    );
  };

  return (
    <Container fluid>
      <Row>
        <Col xs={12}>
          <Card title="Artworks" className="p-mb-4">
            <div className="datatable-container">
              <DataTable
                value={products}
                paginator
                first={(page - 1) * rows}
                rows={rows}
                totalRecords={totalRecords}
                lazy
                onPage={onPageChange}
                loading={loading}
                dataKey="id"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                className="p-datatable-customers"
                selectionMode="multiple"
                selection={selectedProducts}
                onSelectionChange={onSelectionChange}
              >
                <Column
                  body={rowCheckboxBodyTemplate}
                  header={renderCheckboxHeader}
                  headerStyle={{ width: "6rem" }}
                />
                <Column field="title" header="Title" />
                <Column field="place_of_origin" header="Place of Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Start Date" />
                <Column field="date_end" header="End Date" />
              </DataTable>
            </div>
          </Card>
        </Col>
      </Row>
      <OverlayPanel
        ref={op}
        style={{
          padding: "20px",
          maxWidth: "300px",
          border: "1px solid #ced4da",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
        }}
      >
        <div>
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Number of rows"
            style={{ marginBottom: "10px", width: "100%" }}
          />
          <Button
            label="Submit"
            icon="pi pi-check"
            onClick={handleSubmit}
            style={{ width: "100%" }}
          />
        </div>
      </OverlayPanel>
    </Container>
  );
};

export default YourComponent;
