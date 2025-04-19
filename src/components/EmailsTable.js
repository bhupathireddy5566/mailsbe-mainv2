import { Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { useUserData } from "@nhost/react";
import { CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

const GET_EMAILS = gql`
  query getEmails($user_id: String) {
    emails(
      order_by: { created_at: desc }
      where: { user_id: { _eq: $user_id } }
    ) {
      created_at
      description
      email
      id
      img_text
      seen
      seen_at
    }
  }
`;

const DELETE_EMAIL = gql`
  mutation deleteEmail($id: Int!) {
    delete_emails(where: { id: { _eq: $id } }) {
      affected_rows
    }
  }
`;

const EmailsTable = ({ styles }) => {
  const user = useUserData();
  const [emails, setEmails] = useState([]);

  // Use useLazyQuery with proper error handling
  const [getEmails, { loading, data, error }] = useLazyQuery(GET_EMAILS, {
    variables: { user_id: user?.id || "" },
    onCompleted: (data) => {
      if (data?.emails) setEmails(data.emails);
    },
    onError: (error) => {
      toast.error("Failed to fetch emails");
      console.error(error);
    },
  });

  // UseMutation with refetchQueries to update cache
  const [deleteEmailMutation, { loading: deleteLoading }] = useMutation(
    DELETE_EMAIL,
    {
      refetchQueries: [{ query: GET_EMAILS, variables: { user_id: user?.id } }],
    }
  );

  // Fetch emails when user is available
  useEffect(() => {
    if (user?.id) {
      getEmails();
    }
  }, [user?.id]);

  // Delete handler
  const handleDelete = async (id) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this?");
      if (!confirmed) return;

      await deleteEmailMutation({ variables: { id } });
      toast.success("Email deleted successfully");
    } catch (error) {
      toast.error("Failed to delete email");
      console.error(error);
    }
  };

  // Loading state
  if (loading || !user?.id) {
    return (
      <div className={styles.loader}>
        <CircularProgress />
      </div>
    );
  }

  // Error state
  if (error) {
    return <div className={styles.loader}>Error loading emails</div>;
  }

  // Empty state
  if (!emails || emails.length === 0) {
    return <div className={styles.loader}>No emails found</div>;
  }

  return (
    <div className={styles.contentDiv1}>
      {/* Email Column */}
      <div className={styles.columnDiv}>
        <div className={styles.tableHeaderCell}>
          <div className={styles.tableHeaderDiv}>
            <div className={styles.textDiv1}>Email</div>
          </div>
        </div>
        {emails.map((email) => (
          <div className={styles.tableCellDiv} key={email.id}>
            <div className={styles.supportingTextDiv1}>{email.email}</div>
          </div>
        ))}
      </div>

      {/* Status Column */}
      <div className={styles.columnDiv1}>
        <div className={styles.tableHeaderCell1}>
          <div className={styles.tableHeaderDiv1}>
            <div className={styles.textDiv1}>Status</div>
          </div>
        </div>
        {emails.map(({ seen, id }) => (
          <div className={styles.tableCellDiv} key={id}>
            <div className={styles.badgeDiv}>
              <div className={styles.badgeBaseDiv}>
                <div className={seen ? styles.textDiv : styles.textDiv1}>
                  {seen ? "Seen" : "Unseen"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Description Column */}
      <div className={styles.columnDiv2}>
        <div className={styles.tableHeaderCell}>
          <div className={styles.tableHeaderDiv1}>
            <div className={styles.textDiv1}>Description</div>
          </div>
        </div>
        {emails.map(({ description, id }) => (
          <div className={styles.tableCellDiv} key={id}>
            <div className={styles.supportingTextDiv1}>{description}</div>
          </div>
        ))}
      </div>

      {/* Date Sent Column */}
      <div className={styles.columnDiv3}>
        <div className={styles.tableHeaderCell}>
          <div className={styles.tableHeaderDiv1}>
            <div className={styles.textDiv1}>Date sent</div>
          </div>
        </div>
        {emails.map(({ created_at, id }) => (
          <div className={styles.tableCellDiv} key={id}>
            <div className={styles.dateDiv}>
              {new Date(created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Date Seen Column */}
      <div className={styles.columnDiv3}>
        <div className={styles.tableHeaderCell}>
          <div className={styles.tableHeaderDiv1}>
            <div className={styles.textDiv1}>Date seen</div>
          </div>
        </div>
        {emails.map(({ seen_at, id, seen }) => (
          <div className={styles.tableCellDiv} key={id}>
            <div className={styles.dateDiv}>
              {seen ? new Date(seen_at).toLocaleString() : "Not seen"}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Button Column */}
      <div className={styles.dropdownDiv}>
        <div className={styles.tableHeaderCell8} />
        {emails.map(({ id }) => (
          <div className={styles.tableCellButton} key={id}>
            <IconButton
              onClick={() => handleDelete(id)}
              disabled={deleteLoading}
            >
              <Delete />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailsTable;