import React, { useRef, useState } from 'react';

import { useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import './style.css';

const UploadPassengers = () => {
    const { flightId } = useParams();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const updateFileSelection = (nextFile) => {
        setSuccessMessage('');
        setErrorMessage('');

        if (!nextFile) {
            setFile(null);
            setFileName('');
            resetFileInput();
            return;
        }

        const isTxt = nextFile.type === 'text/plain' || nextFile.name.toLowerCase().endsWith('.txt');

        if (!isTxt) {
            setFile(null);
            setFileName('');
            setErrorMessage('Only .txt manifest files are supported.');
            resetFileInput();
            return;
        }

        setFile(nextFile);
        setFileName(nextFile.name);
    };

    const handleFileChange = (event) => {
        const nextFile = event.target.files?.[0];
        updateFileSelection(nextFile || null);
    };

    const handleReset = () => {
        if (uploading) return;
        updateFileSelection(null);
        setSuccessMessage('');
        setErrorMessage('');
        setIsDragActive(false);
    };

    const handleBrowseClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!uploading) {
            fileInputRef.current?.click();
        }
    };

    const handleDropZoneClick = () => {
        if (!uploading) {
            fileInputRef.current?.click();
        }
    };

    const handleDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (uploading) return;
        setIsDragActive(true);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (uploading) return;
        setIsDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget)) {
            return;
        }
        setIsDragActive(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);
        if (uploading) return;

        const droppedFile = event.dataTransfer?.files?.[0];
        if (droppedFile) {
            updateFileSelection(droppedFile);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setErrorMessage('Please choose a .txt manifest before uploading.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await axiosInstance.post(`/api/passengers/${flightId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const payload = typeof response.data === 'string' ? { message: response.data } : response.data;
            setSuccessMessage(payload?.message || 'Passengers imported successfully.');
        } catch (error) {
            console.error('Upload failed:', error);
            setErrorMessage('An error occurred while uploading the manifest. Try again or verify the file format.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <section className="upload-passengers-page">
            <div className="upload-passengers-card">
                <header className="upload-head">
                    <div>
                        <p className="eyebrow">Passenger operations</p>
                        <h1>Add passengers from file</h1>
                        <p className="subtext">Upload the latest manifest to keep the flight roster up to date.</p>
                    </div>
                    <div className="upload-meta">
                        <div className="upload-meta-block">
                            <span>Flight number</span>
                            <strong>{flightId}</strong>
                        </div>
                        <div className="upload-meta-block">
                            <span>Allowed format</span>
                            <strong>.txt</strong>
                        </div>
                        <div className="upload-meta-block">
                            <span>Max passengers</span>
                            <strong>200 entries</strong>
                        </div>
                    </div>
                </header>

                {successMessage && (
                    <div className="inline-banner success">
                        <span>{successMessage}</span>
                        <button type="button" onClick={() => setSuccessMessage('')} aria-label="Dismiss success">
                            ×
                        </button>
                    </div>
                )}
                {errorMessage && (
                    <div className="inline-banner error">
                        <span>{errorMessage}</span>
                        <button type="button" onClick={() => setErrorMessage('')} aria-label="Dismiss error">
                            ×
                        </button>
                    </div>
                )}

                <form className="upload-form" onSubmit={handleSubmit}>
                    <div className="upload-form-grid">
                        <div className="file-column">
                            <input
                                id="manifest-upload"
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleFileChange}
                                disabled={uploading}
                                hidden
                            />

                            <div
                                className={`file-dropzone ${isDragActive ? 'is-dragging' : ''} ${uploading ? 'is-disabled' : ''}`}
                                onClick={handleDropZoneClick}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        handleDropZoneClick();
                                    }
                                }}
                            >
                                <div className="file-pill">TXT</div>
                                <p className="dropzone-title">Drag & drop your manifest</p>
                                <p className="dropzone-subtitle">
                                    or{' '}
                                    <button type="button" className="link-button" onClick={handleBrowseClick}>
                                        browse files
                                    </button>
                                </p>
                                <p className="file-picker__name">{fileName || 'No file selected yet'}</p>
                                <span className="helper-text">UTF-8 encoded .txt file, up to 5 MB.</span>
                            </div>
                        </div>

                        <aside className="upload-guidelines">
                            <h2>Format checklist</h2>
                            <ul className="guidelines-list">
                                <li>One passenger per line</li>
                                <li>Fields separated with semicolons (;)</li>
                                <li>Example: Jan Kowalski;ABC123456</li>
                                <li>Include national ID/passport number</li>
                            </ul>
                            <p className="helper-text">Tip: export directly from crew planning to avoid mistakes.</p>
                        </aside>
                    </div>

                    <div className="upload-actions">
                        <button type="submit" className="primary-action" disabled={uploading || !file}>
                            {uploading ? 'Uploading…' : 'Upload manifest'}
                        </button>
                        <button type="button" className="ghost-action" onClick={handleReset} disabled={!file || uploading}>
                            Clear selection
                        </button>
                    </div>
                </form>
            </div>

            {uploading && (
                <div className="loading-overlay" aria-live="polite">
                    <div className="spinner" />

                    <p>Uploading manifest…</p>
                </div>
            )}
        </section>
    );
};

export default UploadPassengers;