import React, {FormEventHandler, useState} from 'react'
import {NarrowContainer, Search} from "~/components";
import axios from "axios";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import { IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PhotoCameraRoundedIcon from "@material-ui/icons/PhotoCameraRounded";
import {SfButton, SfIconClose, SfModal, useDisclosure} from "@storefront-ui/react";


const useStyles = makeStyles((theme) => ({
    root: {
        height: "100%",
        textAlign: "center"
    },
    imgBox: {
        maxWidth: "100%",
        maxHeight: "80%",
        margin: "10px"
    },
    img: {
        height: "inherit",
        maxWidth: "inherit"
    },
    input: {
        display: "none"
    }
}));

export function CreatorBookForm() {
    // a local state to store the currently selected file.


    const handleSubmit: FormEventHandler<HTMLFormElement> = async(event) => {
        // event.preventDefault()
        // const formData = new FormData();
        // formData.append("filename", selectedFile);
        // try {
        //     const response = await axios({
        //         method: "post",
        //         url: "http://yourdomain.gr/rest/V1/custom/documents/upload",
        //         data: formData,
        //         headers: { "Content-Type": "multipart/form-data" },
        //     });
        //     response ? setTitle(response.data[2]) : setTitle('')
        //     open();
        // } catch(error) {
        //     console.log(error)
        // }
    }

    const handleTitleFromSearch = (val: string) => {
        // setTitle(val)
    }

    const handleFileSelect: FormEventHandler<HTMLFormElement> = (event) => {
        // setSelectedFile(event.target.files[0])
        // if (event.target.files) {
        //     if (event.target.files.length !== 0) {
        //         const file = event.target.files[0];
        //         const newUrl = URL.createObjectURL(file);
        //         setSource(newUrl);
        //     }
        // }
    }

    const classes = useStyles();
    const [source, setSource] = useState("");




    return (
      <NarrowContainer>
          <div className={classes.root}>
              <Grid container>
                  {/*<Grid item xs={12}>*/}
                  {/*    <form>*/}
                  {/*        <input*/}
                  {/*            accept="image/*"*/}
                  {/*            className={classes.input}*/}
                  {/*            id="icon-button-file"*/}
                  {/*            type="file"*/}
                  {/*            // onChange={handleFileSelect}*/}
                  {/*            onChange={handleFileSelect}*/}
                  {/*        />*/}
                  {/*        <label htmlFor="icon-button-file">*/}
                  {/*            <IconButton*/}
                  {/*                color="primary"*/}
                  {/*                aria-label="upload picture"*/}
                  {/*                component="span"*/}
                  {/*            >*/}
                  {/*                <PhotoCameraRoundedIcon fontSize="large" color="primary" />*/}
                  {/*            </IconButton>*/}
                  {/*        </label>*/}
                  {/*        <div>*/}
                  {/*            <SfButton onClick={handleSubmit}*/}
                  {/*                      size="lg" className="mb-4 md:mb-0">*/}
                  {/*                Υποβολή*/}
                  {/*            </SfButton>*/}
                  {/*        </div>*/}
                  {/*    </form>*/}

                      {/*<h5>Φωτογράφησε</h5>*/}
                      {/*<h5>τον τίτλο του βιβλίου</h5>*/}
                      {/*<h5>που θέλεις να αρχειοθετήσεις</h5>*/}
                      {/*{source && (*/}
                      {/*    <Box*/}
                      {/*        display="flex"*/}
                      {/*        justifyContent="center"*/}
                      {/*        border={1}*/}
                      {/*        className={classes.imgBox}*/}
                      {/*    >*/}
                      {/*        <img src={source} alt={"snap"} className={classes.img}></img>*/}
                      {/*    </Box>*/}
                      {/*)}*/}

                  {/*</Grid>*/}
              </Grid>
          </div>
      </NarrowContainer>
  )
}
