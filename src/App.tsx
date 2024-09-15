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
  id : number;
  title : string;
  place_of_origin : string;
  artist_display : string;
  inscriptions : string;
  date_start : string;
  date_end : string;
}

const YourComponent: React.FC = () => {
  const [products,setProducts] = useState<Artwork[]>([])
  const [totalRecords,setTotalRecords] = useState<number>(0);
  const [loading,setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const rows = 12;

  const [selectedProducts, setSelectedProducts] = useState<Artwork[]>([]); 
  const [selectAll,setSelectAll] = useState<boolean>(false);
  
  const op = useRef<OverlayPanel>(null);
  const [inputValue, setInputValue] = useState<string>("");


  const fetchData = async (page : number) => {
    setLoading(true);
    try{
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
      );
      const data = await response.json();
      setProducts(data.data);
      setTotalRecords(data.pagination.total);
    }catch(error){
      console.error('Error fetching data : ', error);
    }
    setLoading(false);
  }

  

  useEffect(() => {
    fetchData(page);
  },[page])


  // const onPageChange = (event: DataTableStateEvent) => {
  //   setPage(event.page! + 1); // Update the current page (PrimeReact is zero-based, so add 1)
  // };

  const onPageChange = (event : DataTableStateEvent) => {
    setPage(event.page! + 1);
  }

  // Row selection handler for checkboxes
  const onSelectionChange = (e: { value: Artwork[] }) => {
    setSelectedProducts(e.value); // Update the selected rows
    setSelectAll(e.value.length === products.length); // Update "Select All" checkbox state
  };

  // Handle checkbox change in each row
  const handleCheckboxChange = (rowData: Artwork) => {
    const isSelected = selectedProducts.some(
      (product) => product.id === rowData.id
    );
    if (isSelected) {
      setSelectedProducts(
        selectedProducts.filter((product) => product.id !== rowData.id)
      );
    } else {
      setSelectedProducts([...selectedProducts, rowData]);
    }
  };

  // Handle "Select All" checkbox change
  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setSelectedProducts(products); // Select all products
    } else {
      setSelectedProducts([]); // Deselect all products
    }
    setSelectAll(event.target.checked); // Update "Select All" checkbox state
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Recursive function to select rows across pages
  const selectRowsAcrossPages = async (
    remaining: number,
    currentPage: number,
    selected: Artwork[]
  ) => {
    // If remaining rows to select is 0, return the selected list
    if (remaining <= 0) return selected;

    // Fetch data from the current page
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${rows}`
    );
    const data = await response.json();

    // Add the products from the current page to the selected list
    const newSelected = [...selected, ...data.data.slice(0, remaining)];

    // Calculate the remaining rows to select
    const remainingRows = remaining - data.data.length;

    // If more rows are needed, continue to the next page
    if (remainingRows > 0 && currentPage * rows < totalRecords) {
      return await selectRowsAcrossPages(
        remainingRows,
        currentPage + 1,
        newSelected
      );
    }

    // Return the final selected list
    return newSelected;
  };

  // Handle submit
  const handleSubmit = async () => {
    const numberOfRowsToSelect = parseInt(inputValue);

    // Start selecting rows across pages
    const selected = await selectRowsAcrossPages(
      numberOfRowsToSelect,
      page,
      []
    );

    // Update the selected products state with the final list
    setSelectedProducts(selected);
    op.current?.hide(); // Hide OverlayPanel after submission
  };

  // Handle button click to toggle the OverlayPanel
  const handleButtonClick = (e: React.MouseEvent<SVGElement, MouseEvent>) => {
    op.current?.toggle(e); // Pass the event to toggle
  };

  // Render header with checkbox
  // Render header with checkbox and icon for better UI/UX
  const renderCheckboxHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Checkbox for "Select All" functionality */}
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAllChange}
          style={{
            marginRight: "8px", // Space between checkbox and icon
            width: "18px", // Adjust checkbox size for better alignment
            height: "18px",
            cursor: "pointer",
          }}
        />
        {/* Icon for dropdown with hover effect */}
        <FaAngleDown
          style={{
            color: "#007bff", // Use a primary color for the icon
            fontSize: "1.5em", // Adjust the icon size
            cursor: "pointer", // Make the icon clickable
            transition: "color 0.2s ease-in-out", // Smooth transition effect
          }}
          onClick={handleButtonClick} // Toggle the OverlayPanel on click
          onMouseEnter={(e) => (e.currentTarget.style.color = "#0056b3")} // Hover effect
          onMouseLeave={(e) => (e.currentTarget.style.color = "#007bff")} // Return to original color after hover
        />
      </div>
    );
  };

  // Render checkbox in each row
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
                first={(page - 1) * rows} // Calculate the first record for the current page
                rows={rows} // Set rows per page to 12
                totalRecords={totalRecords} // Total records from API
                lazy // Server-side pagination enabled
                onPage={onPageChange} // Trigger API call when the page changes
                loading={loading} // Show loading indicator while fetching data
                dataKey="id"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                className="p-datatable-customers"
                selectionMode="multiple" // Enable row selection with checkboxes
                selection={selectedProducts} // Pass selected products
                onSelectionChange={onSelectionChange} // Handle row selection change
              >
                <Column
                  body={rowCheckboxBodyTemplate} // Define the body template for row checkboxes
                  header={renderCheckboxHeader} // Define the header with checkbox and icon
                  headerStyle={{ width: "6rem" }} // Adjust width for checkbox column
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
          padding: "20px", // Existing padding
          maxWidth: "300px", // Existing width
          border: "1px solid #ced4da", // Border for the panel
          borderRadius: "10px", // Rounded corners
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
          backgroundColor: "#fff", // Background color for contrast
        }}
      >
        {/* Flex container for input and button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          {/* Styled Input Field */}
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter row number"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              fontSize: "1rem",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              outline: "none",
              transition: "border-color 0.2s ease-in-out",
              marginBottom: "15px",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
          />
          {/* Styled Submit Button */}
          <Button
            label="Submit"
            icon="pi pi-check"
            className="p-button-rounded p-button-primary"
            onClick={handleSubmit}
            style={{
              width: "auto",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "1rem",
              backgroundColor: "#007bff",
              borderColor: "#007bff",
              transition: "background-color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#0056b3")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#007bff")
            }
          />
        </div>
      </OverlayPanel>
    </Container>
  );
};

export default YourComponent;
