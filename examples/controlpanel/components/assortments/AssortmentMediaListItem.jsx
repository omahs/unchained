import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import { Item, Label, Button, Header } from 'semantic-ui-react';
import { SortableElement } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import FormEditAssortmentMediaTexts from './FormEditAssortmentMediaTexts';

const AssortmentMediaListItem = ({
  _id,
  tags,
  file,
  texts,
  isEditing,
  toggleEditing,
  isEditingDisabled,
  removeMedia,
}) => (
  <Item>
    <Item.Image size="tiny" src={file.url} />
    <Item.Content>
      <Item.Header as="a" href={file.url} target="_blank">
        {file.name}
      </Item.Header>
      <Item.Meta>
        <span className="cinema">
          {file.size / 1000}
          kb {file.type}
        </span>
      </Item.Meta>
      <Item.Description>
        {isEditing ? (
          <FormEditAssortmentMediaTexts
            assortmentMediaId={_id}
            isEditingDisabled={isEditingDisabled}
            onCancel={toggleEditing}
            onSubmitSuccess={toggleEditing}
          />
        ) : (
          <div>
            <Header as="h3">{texts?.title}</Header>
            <p>{texts && texts.subtitle}</p>
          </div>
        )}
      </Item.Description>
      <Item.Extra>
        {tags && tags.map((tag) => <Label key={`tag-${tag}`}>{tag}</Label>)}
        {!isEditing && !isEditingDisabled && (
          <Button floated="right" onClick={toggleEditing}>
            Edit
          </Button>
        )}
        {!isEditing && !isEditingDisabled && (
          <Button secondary floated="right" onClick={removeMedia}>
            Delete
          </Button>
        )}
      </Item.Extra>
    </Item.Content>
  </Item>
);

export default compose(
  graphql(
    gql`
      mutation removeAssortmentMedia($assortmentMediaId: ID!) {
        removeAssortmentMedia(assortmentMediaId: $assortmentMediaId) {
          _id
        }
      }
    `,
    {
      name: 'removeAssortmentMedia',
      options: {
        refetchQueries: ['assortmentMedia'],
      },
    },
  ),
  withState('isEditing', 'setIsEditing', false),
  withHandlers({
    removeMedia:
      ({ removeAssortmentMedia, _id }) =>
      async () => {
        await removeAssortmentMedia({
          variables: {
            assortmentMediaId: _id,
          },
        });
      },
    toggleEditing:
      ({ isEditing, setIsEditing }) =>
      (event) => {
        if (event && event.preventDefault) event.preventDefault();
        setIsEditing(!isEditing);
      },
  }),
  SortableElement,
)(AssortmentMediaListItem);
