import React, { useEffect } from "react";
import { SvgIcon, Fab, Typography } from '@mui/material'
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { CircularProgress } from '@mui/material'
import Box from '@mui/material/Box'
import Turndown from "turndown";
import Button from '@mui/material/Button'
import { useChromeStorageLocal } from 'use-chrome-storage'
import ReactMarkdown from 'react-markdown'
import { getLocalStorageKey, userDataToMap } from "../../../utils/storageUtil"

const fabStyle = {
    margin: 0,
    top: 'auto',
    right: 50,
    bottom: 50,
    left: 'auto',
    position: 'fixed'
}

const NotionLogo = () => {
  return (
    <SvgIcon fontSize='large'>
        <path d='M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z' />
    </SvgIcon>
  )
}

const turnToMarkdown = () => {

    const turndown = new Turndown({
        // headings will be converted to "## Heading"
        // headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
        preformattedCode: true
    });

    turndown.addRule('pre', {
        filter: (node) => node.nodeName === 'PRE',
        replacement: (content) => '```\n' + content + '\n```\n',
    });

    turndown.addRule('code', {
        filter: (node) => node.nodeName === 'CODE',
        replacement: (content) => content.trim(),
    });


    const chatData = get_current_chat_text()

    let totalConv = "";
    let title = ''
    if(document.title) {
        totalConv += "# " + document.title + "<br>";
        title = document.title
    } else {
        totalConv += "# " + "ChatGPT Conversation" + " " + new Date() + "<br>";
        title = "ChatGPT Conversation" + " " + new Date()
    }
    totalConv += "<br>";

    totalConv+=chatData.toString()

    const res = turndown.turndown(totalConv);

    return { pageTitle: title,  pageData: res}
}

function get_current_chat_text() {
    let mainElement = document.querySelector("main");
    // should be more robust, can't see how they would change the flex col anytime soon
    let chatContainer = mainElement.querySelector(".flex-col");
    // what is one part of a conversation called again? let's just call it a chat bubble
    let chatBubbleElements = chatContainer.children;
    let chat = [];

    // remember to disregard the last element, which is always a filler element
    for(let i = 0; i < chatBubbleElements.length-1; i++)
    {
        let isHuman = (i % 2) === 0;
        let chatBubble = chatBubbleElements[i];
        let text = get_chat_bubble_text(chatBubble, isHuman);
        chat.push(text);
    }

    return chat;
}

// gets chat with errors, for current export.
function get_chat_bubble_text(chatBubble, isHuman)
{
    let text;
    if(isHuman) {
        text = chatBubble.innerText;
        if(text.includes("Save & Submit\nCancel"))
        {
            // query the textarea instead
            text = chatBubble.querySelector("textarea")?.value;
        }
        // for code
        text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
        text = saveChildInnerHTML(chatBubble.firstChild.children[1].firstChild.firstChild.firstChild) // saves as html
    }
    return text;
}

function saveChildInnerHTML(parent, clone = true) { // generated by ChatGPT
    // Get the child elements of the parent
    let p1;
    document.body.appendChild(document.createElement(`div`)).setAttribute("id", "chat_history");
    let history_box = document.querySelector("#chat_history");
    if (clone) {
        p1 = parent.cloneNode(true)
        p1.setAttribute("style", "display: none;");
        history_box.innerHTML = "";
        history_box.appendChild(p1);
    } else {
        p1 = parent
    }
    var children = p1.children;

    // Create a string to store the innerHTML of each child
    var childInnerHTML = '';

    // Loop through each child element
    for (var i = 0; i < children.length; i++) {
        // Clone the child element
        var child = children[i];
        if (child.tagName === "PRE") {
            let div = child.firstChild.children[1]
            div.firstChild.classList.add('p-4')
            let text = div.innerHTML
            let clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`
            let copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`
            let template = `<pre><div>${text}</div></pre><br>`
            childInnerHTML += template;
        } else {
            // Remove the child's class attribute
            child.removeAttribute("class");

            // Recursively call the function on the child's children
            saveChildInnerHTML(child, false);

            // Add the child's innerHTML to the string
            childInnerHTML += child.outerHTML;
        }
    }

    return childInnerHTML;
}

export const FabComp = () => {

    const localStorageKey = getLocalStorageKey()

    const [notionTitle, setNotionTitle] = React.useState('')
    const [fabOpen, setFabOpen] = React.useState(true)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [notionPageData, setNotionPageData] = React.useState('')
    const [value, isPersistent, error] = useChromeStorageLocal(localStorageKey)
    const [notionLinked, setNotionLinked] = React.useState(false)
    const [parentExists, setParentExists] = React.useState(false)
    const [status, setStatus] = React.useState({
        loading: false,
        success: false,
        error: false
    })

    useEffect(() => {
        if (value) {
            setNotionLinked(true)
            let userDataMap = userDataToMap(value)
            if (!userDataMap) {
                return
            }

            const selectedIntegrationParent = userDataMap.get('integrationParent')

            if (selectedIntegrationParent!=null) {
                if (selectedIntegrationParent.id) {
                    setParentExists(true)
                }
            }

        }
    }, [value])

    useEffect(() => {
        if (status.success || status.error) {
            const timeoutId = setTimeout(() => {
                setStatus({ loading: false, success: false, error: false });
            }, 2000);
            return () => clearTimeout(timeoutId);
        }

        if (status.loading) {
            const timeoutId = setTimeout(() => {
                setStatus({ loading: false, success: false, error: false });
            }, 5000);
            return () => clearTimeout(timeoutId);
        }
    }, [status]);

    const getFabInternal = () => {
        if (status.loading) {
            return (
              <CircularProgress>
                  {NotionLogo}
              </CircularProgress>
            )
        }

        if (status.success) {
            return (
              <CheckCircleIcon
                sx={{
                    color: '#007300'
                }}
              />
            )
        }

        if (status.error) {
            return (
              <ErrorIcon
                sx={{
                    color: '#990014'
                }}
              />
            )
        }

        return NotionLogo()

    }


    const onFabClick = () => {
        setFabOpen(false)
        setDialogOpen(true)
        syncPageData()
    }

    const syncPageData = () => {
        const { pageTitle, pageData } = turnToMarkdown()
        setNotionTitle(pageTitle)
        setNotionPageData(pageData)
    }

    const saveToNotion = async () => {

        if (!value) {
            setNotionLinked(false)
            return
        }

        setStatus({
            error: false,
            loading: true,
            success: false
        })

        setDialogOpen(false)
        setFabOpen(true)

        if (!chrome.runtime) {
            console.log('chrome runtime is not available the horror')
            return
        }

        const userDataMap = userDataToMap(value)

        const integrationParent = userDataMap.get('integrationParent')

        const payload = {
            integrationParent,
            createPageTitle: notionTitle,
            createPageData: notionPageData
        }

        chrome.runtime.sendMessage({ payload }, function(response) {
            // TO DO: handle error responses and updating state etc.
            console.log('response from send message ' + JSON.stringify(response));

            const { error, message } = response
            if (!error) {
                onNotionSaveSuccess(message)
            } else {
                onNotionSaveError(message)
            }

        });
    }

    const onNotionSaveSuccess = (message) => {
        setStatus({
            error: false,
            loading: false,
            success: true
        })
    }

    const onNotionSaveError = () => {
        setStatus({
            error: true,
            loading: false,
            success: false
        })
    }

    const handleDialogClose = () => {
        // if (reason === 'backdropClick') {
        //     event.stopPropagation()
        //     return
        // }
        setDialogOpen(false)
        setFabOpen(true)
    }

    const markdownComp = () => {
        return (
          <ReactMarkdown children={notionPageData} />
        )
    }

    const noIntegrationComp = () => {
        return (
          <>
              <Typography variant='h6' sx={{
                  color: '#990014'
              }}>
                  Notion Integration incomplete
              </Typography>
              <Typography variant='body2'>
                  Use this extension's popup to link a notion account and select a parent database to save the chat.
                  If you just installed the app, please refresh the page, still doesn't work please contact me.
              </Typography>
          </>
        )
    }

    return(
      <>
          {
              fabOpen &&
            <Fab style={fabStyle} aria-label="chatGPT" onClick={onFabClick}>
                {getFabInternal()}
            </Fab>
          }

          <Dialog
            open={dialogOpen}
            onClose={handleDialogClose}
            maxWidth='xs'
            sx={{
                margin: 0,
                right: 20,
                bottom: 20,
                left: 'auto',
                position: 'fixed',
            }}
          >
              <DialogTitle>
                  <Box display="flex" alignItems="center">
                      <Box flexGrow={1} >
                          <TextField
                            label="Title"
                            value={notionTitle}
                            onChange={(e) => setNotionTitle(e.target.value)}
                            variant={'standard'}
                            fullWidth
                          />
                      </Box>
                  </Box>
              </DialogTitle>
              <DialogContent>
                  {
                      (notionLinked && parentExists)
                        ?
                        markdownComp() : noIntegrationComp()
                  }
              </DialogContent>
              <DialogActions>
                  <Button
                    fullWidth
                    variant='contained'
                    onClick={saveToNotion}
                    disabled={!notionLinked || !parentExists}
                    sx={{
                      backgroundColor: '#171412',
                        '&:hover': {
                            backgroundColor: '#171412'
                        }
                    }}>
                      Save
                  </Button>
              </DialogActions>
          </Dialog>
      </>
    )
}